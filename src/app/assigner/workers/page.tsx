'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Worker { id: string; name: string; email?: string | null }
interface Counts { open: number; ready: number; progress: number }

export default function WorkersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session && session.user.role === 'WORKER') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (res.ok) {
      const list: Array<{ id: string; name: string; email?: string | null; role: string }> = await res.json();
      const onlyWorkers = list.filter((u) => u.role === 'WORKER');
      setWorkers(onlyWorkers);
      // her worker için status sayıları
      const map: Record<string, Counts> = {};
      await Promise.all(onlyWorkers.map(async (w) => {
        const r = await fetch(`/api/tasks?assigned_to=${w.id}&limit=999`, { cache: 'no-store' });
        if (r.ok) {
          const arr: Array<{ status: string }> = await r.json();
          map[w.id] = {
            open: arr.filter(t => t.status === 'NOT_STARTED').length,
            ready: arr.filter(t => t.status === 'NEW_STARTED').length,
            progress: arr.filter(t => t.status === 'IN_PROGRESS').length,
          };
        } else {
          map[w.id] = { open: 0, ready: 0, progress: 0 };
        }
      }));
      setCounts(map);
    }
    setLoading(false);
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="text-gray-600 mt-2">Çalışan listesi ve detayları</p>
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {workers.map((w) => (
            <div key={w.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{w.name}</div>
                {w.email && <div className="text-sm text-gray-500">{w.email}</div>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  <span className="mr-3"><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1"></span>Açık: {counts[w.id]?.open ?? 0}</span>
                  <span className="mr-3"><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span>Hazır: {counts[w.id]?.ready ?? 0}</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>Geliştirme: {counts[w.id]?.progress ?? 0}</span>
                </div>
                <button onClick={() => router.push(`/assigner/workers/${w.id}`)} className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Detay</button>
              </div>
            </div>
          ))}
          {workers.length === 0 && (
            <div className="p-6 text-center text-gray-500">Çalışan bulunamadı.</div>
          )}
        </div>
      </div>
    </div>
  );
}


