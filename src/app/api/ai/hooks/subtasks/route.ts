import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (process.env.N8N_WEBHOOK_SECRET && secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, subtasks } = body || {};
    if (!taskId || !Array.isArray(subtasks)) {
      return NextResponse.json({ error: 'Geçersiz payload' }, { status: 400 });
    }

    const rows = (subtasks as Array<{ title: string; description?: string }> )
      .filter(s => s?.title)
      .map(s => ({ task_id: taskId, title: s.title }));

    if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 });

    const { error } = await supabase.from('subtasks').insert(rows);
    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e) {
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}


