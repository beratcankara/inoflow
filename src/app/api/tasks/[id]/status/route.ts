import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status }: { status: string } = await request.json();
    const { id: taskId } = await params;

    // Mevcut task'ı al
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Durum güncelleme verilerini hazırla
    const updateData: { 
      status: string; 
      started_at?: string; 
      completed_at?: string | null; 
      duration?: number 
    } = { status };

    if (status === 'IN_PROGRESS' && !existingTask.started_at) {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED' && !existingTask.completed_at) {
      updateData.completed_at = new Date().toISOString();
      if (existingTask.started_at) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(existingTask.started_at).getTime()) / 1000
        );
        updateData.duration = duration;
      }
    }

    // Task'ı güncelle
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        client:clients(*),
        system:systems(*),
        assigned_user:users!assigned_to(*),
        creator:users!created_by(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Status değişim logu ekle (best-effort, hata vermezsek de task güncellemesi başarılı kabul edilir)
    const fromStatus = existingTask.status as string | null;
    const toStatus = status;
    try {
      await supabase
        .from('task_status_logs')
        .insert({
          task_id: taskId,
          user_id: session.user.id,
          from_status: fromStatus,
          to_status: toStatus,
        });
    } catch {
      // Sessiz geç
    }

    // Durum değişikliği bildirimi gönder (eğer task'ı oluşturan kişi farklıysa)
    if (updatedTask.created_by !== session.user.id) {
      try {
        const statusTexts = {
          'NOT_STARTED': 'Açık İşler',
          'NEW_STARTED': 'Geliştirilmeye Hazır',
          'IN_PROGRESS': 'Geliştirme Aşamasında',
          'IN_TESTING': 'Teste Verilenler',
          'COMPLETED': 'Tamamlananlar'
        } as const;

        const fromStatusText = fromStatus ? statusTexts[fromStatus as keyof typeof statusTexts] || fromStatus : 'Bilinmeyen';
        const toStatusText = statusTexts[toStatus as keyof typeof statusTexts] || toStatus;

        // Eğer task tamamlandıysa özel bildirim gönder
        if (toStatus === 'COMPLETED') {
          const completionNotificationData = {
            task_id: taskId,
            sender_id: session.user.id,
            receiver_id: updatedTask.created_by,
            type: 'TASK_COMPLETED',
            title: 'İş Tamamlandı',
            message: `🎉 ${updatedTask.assigned_user?.name || 'Çalışan'} "${updatedTask.title}" adlı işi başarıyla tamamladı!`
          };

          const { data: completionNotification, error: completionError } = await supabase
            .from('notifications')
            .insert(completionNotificationData)
            .select()
            .single();

          if (completionError) {
            console.error('Error creating completion notification:', completionError);
          } else {
            console.log('Task completion notification created successfully:', completionNotification);
          }
        } else {
          // Diğer durum değişiklikleri için normal bildirim
          const notificationData = {
            task_id: taskId,
            sender_id: session.user.id,
            receiver_id: updatedTask.created_by, // İşi oluşturan kişiye bildirim gönder
            type: 'TASK_STATUS_CHANGED',
            title: 'İş Durumu Değişti',
            message: `${updatedTask.assigned_user?.name || 'Çalışan'} "${updatedTask.title}" adlı işin durumunu "${fromStatusText}" → "${toStatusText}" olarak değiştirdi.`
          };

          const { data: statusNotification, error: statusError } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();

          if (statusError) {
            console.error('Error creating status change notification:', statusError);
          } else {
            console.log('Task status change notification created successfully:', statusNotification);
          }
        }
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
        // Bildirim hatası task güncellemesini engellemez
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}
