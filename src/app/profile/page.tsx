'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { showToast } from '@/components/Toast';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [/* loading */, /* setLoading */] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  const strength = useMemo(() => {
    const pwd = newPassword;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0-5
  }, [newPassword]);

  const checks = useMemo(() => ([
    { ok: newPassword.length >= 8, label: 'En az 8 karakter' },
    { ok: /[A-Z]/.test(newPassword), label: 'En az 1 büyük harf' },
    { ok: /[a-z]/.test(newPassword), label: 'En az 1 küçük harf' },
    { ok: /\d/.test(newPassword), label: 'En az 1 rakam' },
    { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Özel karakter önerilir' },
  ]), [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Yeni şifreler eşleşmiyor', 'error');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      showToast('Şifre politikası: min 8 karakter, harf ve rakam içermeli', 'error');
      return;
    }
    try {
      setRequesting(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast('Şifreniz güncellendi.', 'success');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        const data = await res.json();
        showToast(data?.error || 'Şifre güncellenemedi', 'error');
      }
    } catch (err) {
      showToast('Beklenmeyen bir hata oluştu', 'error');
    } finally {
      setRequesting(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Bilgiler</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Ad Soyad</div>
                <div className="text-gray-900 font-medium">{session.user?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">E-posta</div>
                <div className="text-gray-900 font-medium">{session.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Rol</div>
                <div className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-700">{session.user?.role}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Şifre Değiştir</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                />
                <div className="mt-2">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div
                      className={`h-2 rounded ${
                        strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {checks.map((c, i) => (
                      <li key={i} className={`flex items-center ${c.ok ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`mr-2 inline-block w-3 h-3 rounded-full ${c.ok ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={requesting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60"
                >
                  {requesting ? 'Şifreniz güncelleniyor...' : 'Şifremi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


