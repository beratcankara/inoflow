import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

// MCP/chat entegrasyonu için kullanıcı doğrulama endpoint'i.
// Auth: Authorization: Bearer <MCP_API_KEY> (geçit) + gövdede {email,password} (bcrypt).
// Chat login'i bunu çağırır; başarılıysa kullanıcıyı döndürür (yazımlar bu kişiye atfedilir).

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

export async function POST(req: NextRequest) {
  try {
    if (!apiKeyOk(req)) {
      return NextResponse.json({ error: 'Unauthorized (API key)' }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const { email, password } = (body ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: 'email ve password gerekli' }, { status: 400 });
    }

    const supabase = serviceClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash')
      .eq('email', email)
      .single();
    if (error || !user) {
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('integration auth error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
