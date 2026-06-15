import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

// MCP (zdev-review) entegrasyon endpoint'i: harici servis-servise çağrı.
// İki katmanlı güvenlik:
//   1) Endpoint geçidi: Authorization: Bearer <MCP_API_KEY> (public prod endpoint'i için).
//   2) Kullanıcı kimliği: gövdedeki email+password, Inoflow'un kendi login mantığıyla doğrulanır
//      (users.password_hash + bcrypt). Not/aktiviteler doğrulanan kullanıcıya yazılır.
// Insert'ler service-role client ile (RLS bypass). Yeni tablo/migration GEREKMEZ.

function apiKeyOk(req: NextRequest): boolean {
  const expected = (process.env.MCP_API_KEY || '').trim();
  if (!expected) return false;
  const header = req.headers.get('authorization') || '';
  const provided = (header.startsWith('Bearer ') ? header.slice(7) : header).trim();
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

function serviceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return createClient(url, key, { auth: { persistSession: false } });
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKeyOk(req)) {
      return NextResponse.json({ error: 'Unauthorized (API key)' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 });
    }

    const { email, password, task_id, report, activity } = body as {
      email?: string;
      password?: string;
      task_id?: string;
      report?: string;
      activity?: { note?: string; time_spent_minutes?: number; activity_date?: string };
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'email ve password gerekli' }, { status: 400 });
    }
    if (!task_id || typeof task_id !== 'string') {
      return NextResponse.json({ error: 'task_id gerekli' }, { status: 400 });
    }
    if (report === undefined && activity === undefined) {
      return NextResponse.json({ error: 'report veya activity gerekli' }, { status: 400 });
    }

    const supabase = serviceClient();

    // Kullanıcıyı doğrula (NextAuth authorize ile aynı mantık)
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('email', email)
      .single();
    if (userErr || !user) {
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
    }
    const createdBy: string = user.id;

    // Task'ı doğrula + client/system bilgisini al (activities için)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, client_id, system_id')
      .eq('id', task_id)
      .single();
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const result: { status: 'ok'; user_id: string; note_id?: string; activity_id?: string } = {
      status: 'ok',
      user_id: createdBy,
    };

    // 1) Rapor → notes (uzun markdown)
    if (report !== undefined) {
      if (typeof report !== 'string' || report.length === 0) {
        return NextResponse.json({ error: 'report boş olmayan metin olmalı' }, { status: 400 });
      }
      const { data: note, error } = await supabase
        .from('notes')
        .insert({ task_id, content: report, created_by: createdBy })
        .select('id')
        .single();
      if (error) {
        console.error('notes insert error', error);
        return NextResponse.json({ error: 'Not oluşturulamadı' }, { status: 500 });
      }
      result.note_id = note.id;
    }

    // 2) Aktivite notu → activities (kısa, zaman-takipli)
    if (activity !== undefined) {
      const note = activity.note;
      const time = activity.time_spent_minutes;
      const date = activity.activity_date || todayISO();
      if (!note || typeof note !== 'string' || note.length === 0 || note.length > 2000) {
        return NextResponse.json({ error: 'activity.note 1-2000 karakter olmalı' }, { status: 400 });
      }
      if (typeof time !== 'number' || time <= 0 || time > 1440) {
        return NextResponse.json(
          { error: 'activity.time_spent_minutes 1-1440 olmalı' },
          { status: 400 },
        );
      }
      if (!task.client_id || !task.system_id) {
        return NextResponse.json(
          { error: 'Task client/system bilgisi yok; aktivite oluşturulamaz' },
          { status: 400 },
        );
      }
      const { data: act, error } = await supabase
        .from('activities')
        .insert({
          task_id,
          user_id: createdBy,
          client_id: task.client_id,
          system_id: task.system_id,
          activity_date: date,
          time_spent_minutes: time,
          note,
        })
        .select('id')
        .single();
      if (error) {
        console.error('activities insert error', error);
        return NextResponse.json({ error: 'Aktivite oluşturulamadı' }, { status: 500 });
      }
      result.activity_id = act.id;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error('integration review error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
