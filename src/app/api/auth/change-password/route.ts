import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    // Parola politikası
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      return NextResponse.json({ error: 'Şifre politikası: min 8 karakter, harf ve rakam içermeli' }, { status: 400 });
    }

    const email = session.user.email as string;

    // 1) Kullanıcıyı users tablosundan bul
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash, name, email')
      .eq('email', email)
      .single();
    if (error || !user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // 2) Mevcut şifre kontrolü
    const ok = await bcrypt.compare(currentPassword, user.password_hash as string);
    if (!ok) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 });
    }

    // 3) Yeni şifreyi hashleyip kaydet
    const hash = await bcrypt.hash(newPassword, 12);
    const { error: updErr } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('id', user.id);
    if (updErr) {
      return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 });
    }

    // 4) Bilgilendirme e-postası
    try {
      await sendMail(
        email,
        'Şifreniz Güncellendi',
        `<p>Merhaba ${user.name || ''},</p><p>Hesabınızın şifresi başarıyla güncellendi.</p>`
      );
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}


