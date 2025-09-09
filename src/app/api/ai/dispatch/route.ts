import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await req.json();
    if (!taskId) return NextResponse.json({ error: 'taskId gerekli' }, { status: 400 });

    // Task ve ekleri topla
    const { data: task, error: tErr } = await supabase
      .from('tasks')
      .select('id, title, description, created_by, assigned_to')
      .eq('id', taskId)
      .single();
    if (tErr || !task) return NextResponse.json({ error: 'Task bulunamadı' }, { status: 404 });

    const { data: atts } = await supabase
      .from('task_attachments')
      .select('file_name, mime_type, size_bytes, public_url, storage_path')
      .eq('task_id', taskId);

    const payload = {
      taskId,
      title: task.title,
      description: task.description || '',
      attachments: (atts || []).map(a => ({ name: a.file_name, mime: a.mime_type, size: a.size_bytes, url: a.public_url, path: a.storage_path })),
      requestedBy: { id: session.user.id, role: session.user.role },
      env: { N8N_API_KEY: process.env.N8N_API_KEY },
    };

    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!url) return NextResponse.json({ error: 'N8N_WEBHOOK_URL tanımlı değil' }, { status: 500 });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Webhook-Secret': secret } : {}),
      },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    if (!res.ok) return NextResponse.json({ error: 'n8n çağrısı başarısız', status: res.status, body: txt }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}


