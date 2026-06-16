import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

// MCP (zdev-review) entegrasyon endpoint'i: mevcut işleri (tasks) listeler.
// İki katmanlı güvenlik (review endpoint'i ile bire bir):
//   1) Endpoint geçidi: Authorization: Bearer <MCP_API_KEY>.
//   2) Kullanıcı kimliği: gövdedeki email (+ opsiyonel password). password verilirse bcrypt ile
//      doğrulanır; verilmezse API-key güveni yeterlidir (chat kullanıcıyı girişte doğruladı).
// Okuma service-role client ile (RLS bypass) yapılır; rol-bazlı filtre kodda uygulanır.
// Yeni tablo/migration GEREKMEZ.

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

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  deadline?: string | null;
  client?: { name?: string } | null;
  system?: { name?: string } | null;
};

export async function POST(req: NextRequest) {
  try {
    if (!apiKeyOk(req)) {
      return NextResponse.json({ error: 'Unauthorized (API key)' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 });
    }

    const { email, password, status, limit } = body as {
      email?: string;
      password?: string;
      status?: string;
      limit?: number;
    };

    if (!email) {
      return NextResponse.json({ error: 'email gerekli' }, { status: 400 });
    }

    const supabase = serviceClient();

    // Kullanıcıyı e-posta ile bul (kimlik + rol). review ile aynı doğrulama.
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, password_hash, role')
      .eq('email', email)
      .single();
    if (userErr || !user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
    }
    if (password !== undefined) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
      }
    }

    let query = supabase
      .from('tasks')
      .select('id, title, status, priority, deadline, created_at, client:clients(name), system:systems(name)');

    // Rol-bazlı kapsam: WORKER yalnız kendine atanmış işleri görür; ASSIGNER/ADMIN tümünü.
    if (user.role === 'WORKER') {
      query = query.eq('assigned_to', user.id);
    }

    // Durum filtresi: boş/'active' → COMPLETED hariç; 'all' → filtre yok; aksi → o durum.
    const wantStatus = (status || 'active').trim();
    if (wantStatus === 'active') {
      query = query.neq('status', 'COMPLETED');
    } else if (wantStatus !== 'all') {
      query = query.eq('status', wantStatus);
    }

    const max = typeof limit === 'number' && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;
    const { data: raw, error } = await query
      .order('created_at', { ascending: false })
      .limit(max);

    if (error) {
      console.error('integration tasks query error', error);
      return NextResponse.json({ error: 'Görevler alınamadı' }, { status: 500 });
    }

    const tasks = ((raw as TaskRow[] | null) || []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority ?? null,
      deadline: t.deadline ?? null,
      client: t.client?.name ?? null,
      system: t.system?.name ?? null,
    }));

    const response = NextResponse.json({ ok: true, tasks }, { status: 200 });
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Vary', 'Cookie');
    return response;
  } catch (e) {
    console.error('integration tasks error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
