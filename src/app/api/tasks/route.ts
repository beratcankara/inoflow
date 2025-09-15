import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isDashboard = searchParams.get('dashboard') === 'true';
    const assignedTo = searchParams.get('assigned_to');
    const createdBy = searchParams.get('created_by');

    let query = supabase
      .from('tasks')
      .select(`
        *,
        client:clients(*),
        system:systems(*),
        assigned_user:users!assigned_to(*),
        creator:users!created_by(*),
        subtasks:subtasks(count),
        notes:notes(count)
      `);

    // Opsiyonel filtreler (role-based filtrelemeden önce uygula)
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    // Role-based filtreleme (opsiyonel filtrelerden sonra uygula)
    if (session.user.role === 'WORKER') {
      // Worker kullanıcıları sadece kendilerine atanan işleri görür
      // Eğer assignedTo filtresi yoksa, kendi işlerini göster
      if (!assignedTo) {
        query = query.eq('assigned_to', session.user.id);
      }
    }
    // Assigner kullanıcıları: Dashboard'da TÜM işleri görebilir.
    // Dashboard dışı sayfalarda (ör. kendi görünümü) varsayılan daraltma korunur.
    else if (session.user.role === 'ASSIGNER') {
      if (!isDashboard) {
        if (!assignedTo) {
          query = query.or(`assigned_to.eq.${session.user.id},created_by.eq.${session.user.id}`);
        }
      }
      // isDashboard === true iken herhangi bir ek kısıtlama uygulanmaz (tüm işler)
    }
    // Admin tüm işleri görür (filtreleme yok)

    // Dashboard için: Tamamlanan işlerde son 1 hafta filtresi
    if (isDashboard) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoISO = oneWeekAgo.toISOString();

      // Tamamlanan işler için son 1 hafta filtresi, diğer durumlar için filtre yok
      query = query.or(`status.neq.COMPLETED,and(status.eq.COMPLETED,completed_at.gte.${oneWeekAgoISO})`);
    }

    const { data: raw, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Map base counts from relational selects
    type SupabaseTaskRow = {
      id: string;
      status: string;
      deadline?: string | null;
      created_at: string;
      started_at?: string | null;
      completed_at?: string | null;
      duration?: number | null;
      created_by: string;
      assigned_to: string;
      client_id: string;
      system_id: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      client?: { id: string; name?: string } | null;
      system?: { id: string; name?: string } | null;
      assigned_user?: { id: string; name?: string } | null;
      creator?: { id: string; name?: string } | null;
      subtasks?: Array<{ count: number }>;
      notes?: Array<{ count: number }>;
    };

    let tasks = (raw as SupabaseTaskRow[] | null || []).map((t) => ({
      ...t,
      subtask_count: Array.isArray(t?.subtasks) && t.subtasks[0]?.count ? t.subtasks[0].count : 0,
      note_count: Array.isArray(t?.notes) && t.notes[0]?.count ? t.notes[0].count : 0,
      subtasks: undefined,
      notes: undefined,
    }));

    // Enhance with completed subtask counts from subtask_counts view
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length > 0) {
      const { data: countsData, error: countsError } = await supabase
        .from('subtask_counts')
        .select('task_id,total,completed')
        .in('task_id', taskIds);

      if (!countsError && countsData) {
        const countsMap = new Map<string, { total: number; completed: number }>();
        for (const row of countsData as Array<{ task_id: string; total: number; completed: number }>) {
          countsMap.set(row.task_id, { total: row.total ?? 0, completed: row.completed ?? 0 });
        }
        tasks = tasks.map((t) => {
          const c = countsMap.get(t.id);
          if (c) {
            return { ...t, subtask_count: c.total, completed_subtask_count: c.completed };
          }
          return { ...t, completed_subtask_count: 0 };
        });
      }
    }

    // Kimliği doğrulanmış ve kullanıcıya göre değişen veri: cache KAPALI
    const response = NextResponse.json(tasks);
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Vary', 'Cookie');
    return response;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Worker kullanıcıları sadece kendilerine iş atayabilir
    if (session.user.role === 'WORKER' && body.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Workers can only assign tasks to themselves' }, { status: 403 });
    }
    
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: body.title,
        description: body.description,
        client_id: body.client_id,
        system_id: body.system_id,
        assigned_to: body.assigned_to,
        created_by: session.user.id,
        deadline: body.deadline ? new Date(body.deadline).toISOString() : null,
        priority: body.priority || 'MEDIUM',
      })
      .select(`
        *,
        client:clients(*),
        system:systems(*),
        assigned_user:users!assigned_to(*),
        creator:users!created_by(*)
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Task atama bildirimi gönder (eğer başka birine atanıyorsa)
    if (task.assigned_to !== session.user.id) {
      try {
        await supabase
          .from('users')
          .select('id')
          .eq('id', task.assigned_to)
          .single();

        const notificationData = {
          task_id: task.id,
          sender_id: session.user.id,
          receiver_id: task.assigned_to,
          type: 'TASK_ASSIGNED',
          title: 'Yeni İş Atandı',
          message: `${session.user.name} size "${task.title}" adlı işi atadı.`
        };

        const { data: notification, error: notificationInsertError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select()
          .single();

        if (notificationInsertError) {
          console.error('Error creating task assignment notification:', notificationInsertError);
        } else {
          console.log('Task assignment notification created successfully:', notification);
        }
      } catch (notificationError) {
        console.error('Error creating task assignment notification:', notificationError);
        // Bildirim hatası task oluşturmayı engellemez
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
