'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import { showToast } from '@/components/Toast';

interface Client { id: string; name: string; description?: string | null }
interface System { id: string; name: string; description?: string | null; client_id: string }

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClient, setEditClient] = useState<{ name: string; description?: string }>({ name: '' });
  const [sysForm, setSysForm] = useState<{ id?: string; name: string; description?: string } | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'client' | 'system'; id: string; title: string } | null>(null);

  // ESC ile silme modali kapatma
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirm(null);
    };
    if (confirm) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [confirm]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  useEffect(() => {
    fetchAll();
  }, [clientId]);

  const fetchAll = async () => {
    setLoading(true);
    // Clients listten tek çekiş olmadığı için basit filter ile alıyoruz
    const cRes = await fetch('/api/clients', { cache: 'no-store' });
    if (cRes.ok) {
      const list: Client[] = await cRes.json();
      const c = list.find(x => x.id === clientId) || null;
      setClient(c);
      if (c) setEditClient({ name: c.name, description: c.description || '' });
    }
    const sRes = await fetch(`/api/systems?clientId=${clientId}`, { cache: 'no-store' });
    if (sRes.ok) setSystems(await sRes.json());
    setLoading(false);
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: clientId, ...editClient }) });
    if (res.ok) { showToast('Müşteri güncellendi', 'success'); router.push('/assigner/clients'); }
  };

  const createOrUpdateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sysForm) return;
    const method = sysForm.id ? 'PATCH' : 'POST';
    const payload = sysForm.id ? { id: sysForm.id, name: sysForm.name, description: sysForm.description } : { client_id: clientId, name: sysForm.name, description: sysForm.description };
    const res = await fetch('/api/systems' + (method === 'PATCH' ? '' : ''), { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { showToast(sysForm.id ? 'Sistem güncellendi' : 'Sistem eklendi', 'success'); setSysForm(null); fetchAll(); }
  };

  const deleteSystem = async (id: string) => {
    const res = await fetch(`/api/systems?id=${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Sistem silindi', 'success'); fetchAll(); }
  };

  const deleteClient = async () => {
    const res = await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE' });
    if (res.ok) { showToast('Müşteri silindi', 'success'); router.push('/assigner/clients'); }
  };

  if (status === 'loading' || loading || !client) {
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Müşteri Detayı</h1>
          <div className="flex items-center space-x-2">
            <button onClick={() => setConfirm({ type: 'client', id: clientId, title: client.name })} className="px-3 py-2 bg-red-600 text-white rounded-md">Müşteriyi Sil</button>
          </div>
        </div>

        {/* Müşteri Bilgileri */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Genel Bilgiler</h2>
          <form onSubmit={saveClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <input value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input value={editClient.description || ''} onChange={e => setEditClient({ ...editClient, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Kaydet</button>
            </div>
          </form>
        </div>

        {/* Sistemler */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Sistemler</h2>
          <button onClick={() => setSysForm({ name: '' })} className="px-3 py-2 bg-blue-600 text-white rounded-md">+ Yeni Sistem</button>
        </div>

        {/* Sistem formu */}
        {sysForm && (
          <form onSubmit={createOrUpdateSystem} className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                <input value={sysForm.name} onChange={e => setSysForm({ ...sysForm!, name: e.target.value })} required className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input value={sysForm.description || ''} onChange={e => setSysForm({ ...sysForm!, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button type="button" onClick={() => setSysForm(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">İptal</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">{sysForm.id ? 'Güncelle' : 'Ekle'}</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow divide-y">
          {systems.map(s => (
            <div key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{s.name}</div>
                {s.description && <div className="text-sm text-gray-500">{s.description}</div>}
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setSysForm({ id: s.id, name: s.name, description: s.description || '' })} className="px-3 py-1 bg-yellow-500 text-white rounded-md">Düzenle</button>
                <button onClick={() => setConfirm({ type: 'system', id: s.id, title: s.name })} className="px-3 py-1 bg-red-600 text-white rounded-md">Sil</button>
              </div>
            </div>
          ))}
          {systems.length === 0 && (
            <div className="p-6 text-center text-gray-500">Bu müşteriye bağlı sistem yok.</div>
          )}
        </div>
      </div>

      {/* Silme Onay Modalı */}
      {confirm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[120]" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Silme Onayı</h3>
            <p className="text-gray-600 mb-6">&quot;{confirm.title}&quot; {confirm.type === 'client' ? 'müşterisini' : 'sistemini'} silmek istiyor musunuz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md">İptal</button>
              <button onClick={() => { confirm.type === 'client' ? deleteClient() : deleteSystem(confirm.id); setConfirm(null); }} className="px-4 py-2 bg-red-600 text-white rounded-md">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


