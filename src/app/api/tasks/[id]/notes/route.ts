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

    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        *,
        author:users!created_by(*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
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

    // Worker kullanıcıları sadece kendilerine atanan işlere not ekleyebilir
    if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Assigner kullanıcıları kendilerine atanan ve oluşturdukları işlere not ekleyebilir
    if (session.user.role === 'ASSIGNER' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        task_id: taskId,
        content: body.content,
        created_by: session.user.id,
      })
      .select(`
        *,
        author:users!created_by(*)
      `)
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const body = await request.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Önce notun var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select(`
        *,
        task:tasks!task_id(*)
      `)
      .eq('id', noteId)
      .eq('task_id', taskId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Kullanıcının bu task'a erişim yetkisi var mı kontrol et
    const task = note.task;
    if (session.user.role !== 'ADMIN' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Notu güncelle
    const { data: updatedNote, error: updateError } = await supabase
      .from('notes')
      .update({ content: body.content })
      .eq('id', noteId)
      .select(`
        *,
        author:users!created_by(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating note:', updateError);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Önce notun var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select(`
        *,
        task:tasks!task_id(*)
      `)
      .eq('id', noteId)
      .eq('task_id', taskId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Kullanıcının bu task'a erişim yetkisi var mı kontrol et
    const task = note.task;
    if (session.user.role !== 'ADMIN' && 
        task.assigned_to !== session.user.id && 
        task.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Notu sil
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (deleteError) {
      console.error('Error deleting note:', deleteError);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
