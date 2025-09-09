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


