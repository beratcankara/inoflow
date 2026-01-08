'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Task } from '@/types/task';
import { supabase } from '@/lib/supabase';

const KanbanBoard = dynamic(() => import('@/components/KanbanBoard'), {
  ssr: false,
  loading: () => (
    <div className="p-6"><div className="h-40 bg-gray-100 rounded animate-pulse" /></div>
  )
});

const TaskList = dynamic(() => import('@/components/TaskList'), {
  ssr: false,
  loading: () => (
    <div className="p-6 space-y-3">
      <div className="h-6 bg-gray-100 rounded animate-pulse" />
      <div className="h-6 bg-gray-100 rounded animate-pulse" />
      <div className="h-6 bg-gray-100 rounded animate-pulse" />
    </div>
  )
});

// Task interface artık types/task.ts'den import ediliyor

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [focusStatus, setFocusStatus] = useState<'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED' | undefined>(undefined);
  const [dateScope, setDateScope] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const lastRefreshAtRef = useRef<number>(0);
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/auth/signin'); // Not authenticated
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  // Assigner için kullanıcı listesini getir
  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (session?.user.role !== 'ASSIGNER') return;
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (res.ok) {
          const all = await res.json();
          setUsers(all);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    };
    loadUsers();
  }, [session]);

  // Tarih filtresi değiştiğinde güncel scope ile yeniden yükle
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [dateScope, session]);

  // Realtime: tasks tablosunu dinle ve ilgiliyse listeyi tazele
  useEffect(() => {
    if (!session) return;
    const realtimeEnabled = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ENABLED !== 'false';
    if (!realtimeEnabled) return;

    const scheduleRefresh = () => {
      const now = Date.now();
      const elapsed = now - lastRefreshAtRef.current;
      if (elapsed > 2000 && !pendingRefreshRef.current) {
        lastRefreshAtRef.current = now;
        fetchTasks();
        return;
      }
      if (!pendingRefreshRef.current) {
        pendingRefreshRef.current = setTimeout(() => {
          lastRefreshAtRef.current = Date.now();
          pendingRefreshRef.current = null;
          fetchTasks();
        }, Math.max(0, 2000 - elapsed));
      }
    };

    const channel = supabase
      .channel('tasks-realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const row = (payload.new || payload.old) as Partial<Task> & { assigned_to?: string; created_by?: string };
        const me = session.user.id;
        const role = session.user.role;
        const relevant = role === 'ADMIN' || role === 'ASSIGNER' || (role === 'WORKER' && row?.assigned_to === me);
        if (relevant) {
          scheduleRefresh();
        }
      })
      .subscribe();

    return () => {
      if (pendingRefreshRef.current) {
        clearTimeout(pendingRefreshRef.current);
        pendingRefreshRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // Dashboard için filtrelenmiş API kullanımı
      const qs = new URLSearchParams();
      qs.set('dashboard', 'true');
      qs.set('limit', '80');
      if (selectedUserId) qs.set('assigned_to', selectedUserId);
      const response = await fetch(`/api/tasks?${qs.toString()}`, { cache: 'no-store' });
      if (response.ok) {
        const tasks = await response.json();
        // Date scope filtrelemesi (client-side basit)
        const filtered = tasks.filter((t: Task) => {
          if (!t.deadline || t.status === 'COMPLETED' || dateScope === 'ALL') return true;
          const dl = new Date(t.deadline as unknown as string);
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          if (dateScope === 'TODAY') {
            return dl >= startOfToday && dl < endOfToday;
          }
          if (dateScope === 'WEEK') {
            const weekAhead = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dl < weekAhead;
          }
          return true;
        });
        setTasks(filtered);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [dateScope, selectedUserId]);

  // Kullanıcı filtresi değiştiğinde yeniden yükle
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [selectedUserId, session, fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail page
    router.push(`/tasks/${task.id}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove task from local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
          <p className="mt-2 text-sm text-gray-500">Son 1 hafta tamamlanan işler gösteriliyor</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Calculate statistics
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
  const completedTasksWithDuration = tasks.filter(task => task.status === 'COMPLETED' && task.duration);
  const averageDuration = completedTasksWithDuration.length > 0 
    ? Math.round(completedTasksWithDuration.reduce((sum, task) => sum + (task.duration || 0), 0) / completedTasksWithDuration.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş geldiniz, {session.user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            İş yönetim panonuz
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Son 1 hafta tamamlanan işler gösteriliyor
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">Toplam İş</h3>
            <p className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{totalTasks}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors">Devam Eden</h3>
            <p className="text-3xl font-bold text-yellow-600 group-hover:scale-110 transition-transform">{inProgressTasks}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">Tamamlanan</h3>
            <p className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">{completedTasks}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">Ortalama Süre</h3>
            <p className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
              {averageDuration > 0 ? `${Math.floor(averageDuration / 3600)}s ${Math.floor((averageDuration % 3600) / 60)}d` : '0s'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">İşlerim</h2>
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'kanban'
                        ? 'bg-white text-gray-900 shadow-sm scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                    }`}
                  >
                    Liste
                  </button>
                </div>
                {/* Tarih segmenti */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['ALL','TODAY','WEEK'] as const).map(seg => (
                    <button
                      key={seg}
                      onClick={() => { setDateScope(seg); }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        dateScope === seg ? 'bg-white text-gray-900 shadow-sm scale-105' : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                      }`}
                    >
                      {seg === 'ALL' ? 'Tümü' : seg === 'TODAY' ? 'Bugün' : 'Hafta'}
                    </button>
                  ))}
                </div>
                <Link 
                  href="/tasks"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Tümünü Gör
                </Link>
              </div>
            </div>
            {session.user.role === 'ASSIGNER' && (
              <div className="px-6 py-3 border-t bg-gray-50 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedUserId === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Tümü
                  </button>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(prev => (prev === u.id ? null : u.id))}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedUserId === u.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                      title={u.name}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-6">
              {viewMode === 'kanban' ? (
                <KanbanBoard
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleStatusChange}
                  onTaskDelete={handleDeleteTask}
                  focusStatus={focusStatus}
                  onFocusToggle={(st) => setFocusStatus(prev => prev === st ? undefined : st)}
                />
              ) : (
                <TaskList
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleStatusChange}
                  showActions={true}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Son İşler</h2>
                <Link 
                  href="/tasks"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="p-6">
                <TaskList
                  tasks={tasks.slice(0, 5)}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleStatusChange}
                  showActions={true}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hızlı İşlemler</h3>
              <div className="space-y-3">
                <Link
                  href="/tasks"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors"
                >
                  Yeni İş Oluştur
                </Link>
                <Link
                  href="/tasks"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-md transition-colors"
                >
                  İşleri Görüntüle
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Yaklaşan Deadline&apos;lar</h3>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.deadline && task.status !== 'COMPLETED')
                  .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                  .slice(0, 3)
                  .map(task => (
                    <div key={task.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate">{task.title}</span>
                      <span className="text-gray-500">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : ''}
                      </span>
                    </div>
                  ))}
                {tasks.filter(task => task.deadline && task.status !== 'COMPLETED').length === 0 && (
                  <p className="text-gray-500 text-sm">Yaklaşan deadline yok</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
