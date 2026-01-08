'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';

type DateScope = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

interface Task {
  id: string;
  title: string;
  status: 'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED';
  created_at: string;
  completed_at?: string | null;
  duration?: number | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function WorkerDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const workerId = params?.id as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [worker, setWorker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateScope, setDateScope] = useState<DateScope>('MONTH');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session && session.user.role === 'WORKER') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => { 
    if (workerId) {
      fetchWorker();
      fetchTasks(); 
    }
  }, [workerId, dateScope]);

  const fetchWorker = async () => {
    try {
      const res = await fetch(`/api/users/${workerId}`, { cache: 'no-store' });
      if (res.ok) {
        const userData: User = await res.json();
        setWorker(userData);
      }
    } catch (error) {
      console.error('Error fetching worker:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // assigned_to filtreli tüm işleri çekiyoruz ve client-side tarih filtresi uyguluyoruz
      const res = await fetch(`/api/tasks?assigned_to=${workerId}`, { cache: 'no-store' });
      if (res.ok) {
        const list: Task[] = await res.json();
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = dateScope === 'TODAY' ? startOfToday : dateScope === 'WEEK' ? startOfWeek : dateScope === 'MONTH' ? startOfMonth : new Date(0);
        const filtered = list.filter(t => new Date(t.created_at) >= start);
        setTasks(filtered);
      } else {
        console.error('Failed to fetch tasks:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  };

  const metrics = useMemo(() => {
    const counts = {
      total: tasks.length,
      not_started: tasks.filter(t => t.status === 'NOT_STARTED').length,
      new_started: tasks.filter(t => t.status === 'NEW_STARTED').length,
      in_progress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      in_testing: tasks.filter(t => t.status === 'IN_TESTING').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
    };
    const completed = tasks.filter(t => t.status === 'COMPLETED' && t.duration);
    const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + (t.duration || 0), 0) / completed.length) : 0;
    return { counts, avg };
  }, [tasks]);

  const recentAssigned = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
  }, [tasks]);

  const recentCompleted = useMemo(() => {
    return tasks.filter(t => t.status === 'COMPLETED' && t.completed_at).sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()).slice(0, 10);
  }, [tasks]);

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
            <h1 className="text-3xl font-bold text-gray-900">Çalışan Detayı</h1>
            {worker && (
              <p className="text-lg text-gray-600 mt-1">{worker.name}</p>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['ALL','TODAY','WEEK','MONTH'] as DateScope[]).map(seg => (
              <button key={seg} onClick={() => setDateScope(seg)} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${dateScope===seg?'bg-white text-gray-900 shadow-sm scale-105':'text-gray-600 hover:text-gray-900'}`}>
                {seg==='ALL'?'Tümü':seg==='TODAY'?'Bugün':seg==='WEEK'?'Hafta':'Ay'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Toplam İş</h3><p className="text-3xl font-bold text-blue-600">{metrics.counts.total}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Yapılacak</h3><p className="text-3xl font-bold text-gray-700">{metrics.counts.not_started}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Yeni</h3><p className="text-3xl font-bold text-blue-600">{metrics.counts.new_started}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Devam</h3><p className="text-3xl font-bold text-yellow-600">{metrics.counts.in_progress}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Test</h3><p className="text-3xl font-bold text-purple-600">{metrics.counts.in_testing}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Tamamlanan</h3><p className="text-3xl font-bold text-green-600">{metrics.counts.completed}</p></div>
          <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-sm text-gray-500">Ortalama Süre</h3><p className="text-3xl font-bold text-indigo-600">{metrics.avg>0?`${Math.floor(metrics.avg/3600)}s ${Math.floor((metrics.avg%3600)/60)}d`:'0s'}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">Son Atananlar</h2></div>
            <div className="p-4 space-y-3">
              {recentAssigned.map(t => (
                <div 
                  key={t.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white"
                  onClick={() => router.push(`/tasks/${t.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{t.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {t.status === 'NOT_STARTED' ? 'Yapılacak' : 
                       t.status === 'NEW_STARTED' ? 'Yeni' :
                       t.status === 'IN_PROGRESS' ? 'Devam' :
                       t.status === 'IN_TESTING' ? 'Test' : 'Tamamlandı'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Atanma: {new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
                    <span className="text-blue-600 hover:text-blue-800">Detay →</span>
                  </div>
                </div>
              ))}
              {recentAssigned.length===0 && <div className="text-center text-gray-500 py-6">Kayıt yok</div>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">Son Tamamlananlar</h2></div>
            <div className="p-4 space-y-3">
              {recentCompleted.map(t => (
                <div 
                  key={t.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white"
                  onClick={() => router.push(`/tasks/${t.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{t.title}</h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Tamamlandı
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Tamamlanma: {t.completed_at ? new Date(t.completed_at).toLocaleDateString('tr-TR') : ''}</span>
                    <span className="text-blue-600 hover:text-blue-800">Detay →</span>
                  </div>
                </div>
              ))}
              {recentCompleted.length===0 && <div className="text-center text-gray-500 py-6">Kayıt yok</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


