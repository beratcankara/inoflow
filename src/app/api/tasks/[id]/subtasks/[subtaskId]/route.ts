import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;
    const body = await request.json();

    // Önce subtask'ın var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select(`
        *,
        task:tasks!task_id(assigned_to, created_by)
      `)
      .eq('id', subtaskId)
      .eq('task_id', taskId)
      .single();

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const task = subtask.task;

    // Worker kullanıcıları sadece kendilerine atanan işlerin subtask'larını güncelleyebilir
    if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Assigner kullanıcıları kendilerine atanan ve oluşturdukları işlerin subtask'larını güncelleyebilir
    if (session.user.role === 'ASSIGNER' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: { completed?: boolean; completed_at?: string | null; title?: string } = {};
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      if (body.completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    const { data: updatedSubtask, error } = await supabase
      .from('subtasks')
      .update(updateData)
      .eq('id', subtaskId)
      .select(`
        *,
        author:users!created_by(*)
      `)
      .single();

    if (error) {
      console.error('Error updating subtask:', error);
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;

    // Önce subtask'ın var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select(`
        *,
        task:tasks!task_id(assigned_to, created_by)
      `)
      .eq('id', subtaskId)
      .eq('task_id', taskId)
      .single();

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const task = subtask.task;

    // Worker kullanıcıları sadece kendilerine atanan işlerin subtask'larını silebilir
    if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Assigner kullanıcıları kendilerine atanan ve oluşturdukları işlerin subtask'larını silebilir
    if (session.user.role === 'ASSIGNER' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
