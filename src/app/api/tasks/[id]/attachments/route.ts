import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    // Basit yetki: task mevcut mu kontrol et (gerekirse role tabanlı ek denetimler eklenebilir)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: task, error: tErr } = await supabaseAdmin
      .from('tasks')
      .select('id, assigned_to, created_by')
      .eq('id', taskId)
      .single();
    if (tErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('task_attachments')
      .select('id, task_id, file_name, mime_type, size_bytes, public_url, storage_path, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
    }

    const res = NextResponse.json(data || []);
    // Prevent caching to always reflect latest attachments
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
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
    const attId = searchParams.get('attId');
    if (!attId) return NextResponse.json({ error: 'Missing attId' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Ek bilgisi ve task yetkisi kontrolü
    const { data: att, error: aErr } = await supabaseAdmin
      .from('task_attachments')
      .select('id, task_id, storage_path')
      .eq('id', attId)
      .eq('task_id', taskId)
      .single();
    if (aErr || !att) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

    // Task yetki: task'ı getir ve aynı mantığı uygula (düzenleme yetkisi)
    const { data: task, error: tErr } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', taskId)
      .single();
    if (tErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const role = session.user.role;
    const canEdit = role === 'ADMIN' ||
      (role === 'WORKER' && task.assigned_to === session.user.id) ||
      (role === 'ASSIGNER' && (task.assigned_to === session.user.id || task.created_by === session.user.id));
    if (!canEdit) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Storage'dan sil
    if (att.storage_path) {
      await supabaseAdmin.storage.from('attachments').remove([att.storage_path]);
    }
    // DB kaydını sil
    const { error: delErr } = await supabaseAdmin
      .from('task_attachments')
      .delete()
      .eq('id', attId);
    if (delErr) return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}


