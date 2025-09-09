import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (process.env.N8N_WEBHOOK_SECRET && secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, summary } = body || {};
    if (!taskId || typeof summary !== 'string') {
      return NextResponse.json({ error: 'Geçersiz payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tasks')
      .update({ summary })
      .eq('id', taskId);
    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}


