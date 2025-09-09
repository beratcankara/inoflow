import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, status, created_at, deadline, duration, assigned_to, created_by,
        client:clients(id, name),
        system:systems(id, name),
        assigned_user:users!assigned_to(id, name),
        creator:users!created_by(id, name)
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Worker kullanıcıları sadece kendilerine atanan işleri görebilir
    if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Assigner kullanıcıları:
    // 1. Kendilerine atanan işleri görebilir
    // 2. Kendilerinin oluşturduğu işleri görebilir  
    // 3. Çalışanların işlerini görebilir (çalışan detay sayfası için)
    if (session.user.role === 'ASSIGNER' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      
      // Çalışanın işi mi kontrol et (assigned_to bir WORKER ise)
      const { data: assignedUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', task.assigned_to)
        .single();
      
      if (userError || !assignedUser || assignedUser.role !== 'WORKER') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Önce işin var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Worker kullanıcıları sadece kendi oluşturdukları işleri silebilir
    if (session.user.role === 'WORKER' && task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Workers can only delete tasks they created' }, { status: 403 });
    }

    // Assigner kullanıcıları kendi oluşturdukları işleri silebilir
    if (session.user.role === 'ASSIGNER' && task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Assigners can only delete tasks they created' }, { status: 403 });
    }

    // Admin kullanıcıları tüm işleri silebilir (zaten yukarıdaki kontrollerden geçti)

    // İşi sil
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
