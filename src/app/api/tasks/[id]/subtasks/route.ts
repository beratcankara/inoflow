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

    const { data: subtasks, error } = await supabase
      .from('subtasks')
      .select(`
        *,
        author:users!created_by(*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subtasks:', error);
      return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
    }

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();

    // Önce işin var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Worker kullanıcıları sadece kendilerine atanan işlere subtask ekleyebilir
    if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Assigner kullanıcıları kendilerine atanan ve oluşturdukları işlere subtask ekleyebilir
    if (session.user.role === 'ASSIGNER' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: taskId,
        title: body.title,
        created_by: session.user.id,
      })
      .select(`
        *,
        author:users!created_by(*)
      `)
      .single();

    if (error) {
      console.error('Error creating subtask:', error);
      return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}
