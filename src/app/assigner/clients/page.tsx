'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { showToast } from '@/components/Toast';

interface Client { id: string; name: string; description?: string | null }

export default function AssignerClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; description?: string }>({ name: '' });
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session && session.user.role === 'WORKER') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const res = await fetch('/api/clients', { cache: 'no-store' });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/clients' + (method === 'PATCH' ? '' : ''), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchClients(); setShowForm(false); setForm({ name: '' }); showToast(form.id ? 'Müşteri güncellendi' : 'Müşteri eklendi', 'success'); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Müşteri silindi', 'success'); fetchClients(); }
  };

  // ESC ile onay modalını kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirm(null); };
    if (confirm) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirm]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role === 'WORKER') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
            <p className="text-gray-600 mt-2">Müşteri ekle, düzenle, sil</p>
          </div>
          <button onClick={() => { setShowForm(true); setForm({ name: '' }); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">+ Yeni Müşteri</button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateOrUpdate} className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md">İptal</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Kaydet</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow divide-y">
          {clients.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{c.name}</div>
                {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => router.push(`/assigner/clients/${c.id}`)} className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Detay</button>
                <button onClick={() => { setForm({ id: c.id, name: c.name, description: c.description || '' }); setShowForm(true); }} className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Düzenle</button>
                <button onClick={() => setConfirm({ id: c.id, title: c.name })} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700">Sil</button>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="p-6 text-center text-gray-500">Müşteri bulunamadı.</div>
          )}
        </div>
      </div>
      {confirm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[120]" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Silme Onayı</h3>
            <p className="text-gray-600 mb-6">&quot;{confirm.title}&quot; müşterisini silmek istiyor musunuz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md">İptal</button>
              <button onClick={() => { handleDelete(confirm.id); setConfirm(null); }} className="px-4 py-2 bg-red-600 text-white rounded-md">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


