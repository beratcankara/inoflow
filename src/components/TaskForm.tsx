'use client';

import { useState, useEffect, memo } from 'react';
import { useSession } from 'next-auth/react';

interface Client {
  id: string;
  name: string;
}

interface System {
  id: string;
  name: string;
  client_id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

import { Task } from '@/types/task';

interface TaskFormProps {
  onSubmit: (taskData: { title: string; description?: string; deadline?: string; client_id: string; system_id: string; assigned_to: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) => Promise<Task | undefined>;
  onCancel: () => void;
  initialData?: { title?: string; description?: string; deadline?: string; client_id?: string; system_id?: string; assigned_to?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' };
}

const TaskForm = memo(function TaskForm({ onSubmit, onCancel, initialData }: TaskFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    system_id: '',
    assigned_to: '',
    deadline: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        client_id: initialData.client_id || '',
        system_id: initialData.system_id || '',
        assigned_to: initialData.assigned_to || '',
        deadline: initialData.deadline || '',
        priority: initialData.priority || 'MEDIUM',
      });
    } else if (session?.user?.role === 'WORKER') {
      // Worker kullanıcıları için assigned_to otomatik olarak kendilerine atanır
      setFormData(prev => ({
        ...prev,
        assigned_to: session.user.id,
      }));
    }
  }, [initialData, session]);

  useEffect(() => {
    // Fetch clients, systems, and users
    fetchData();
  }, []);

  useEffect(() => {
    // Update systems when client changes
    if (formData.client_id) {
      fetchSystems(formData.client_id);
    } else {
      setSystems([]);
    }
  }, [formData.client_id]);

  const fetchData = async () => {
    try {
      const [clientsResponse, usersResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/users')
      ]);
      
      if (clientsResponse.ok) {
        const clients = await clientsResponse.json();
        setClients(clients);
      }
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setUsers(users);
      }
    } catch (error) {
      setError('Veriler yüklenirken hata oluştu');
    }
  };

  const fetchSystems = async (clientId: string) => {
    try {
      const response = await fetch(`/api/systems?clientId=${clientId}`);
      if (response.ok) {
        const systems = await response.json();
        setSystems(systems);
      }
    } catch (error) {
      setError('Sistemler yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const taskData = {
        ...formData,
        created_by: session?.user?.id,
        deadline: formData.deadline || undefined,
        priority: formData.priority,
      };

      const created = await onSubmit(taskData);
      // created task dönerse attachments yükle
      if (created?.id) {
        try {
          setUploading(true);
          // 1) Ekleri yükle (varsa)
          if (files.length > 0) {
            const form = new FormData();
            form.append('taskId', created.id);
            for (const f of files) form.append('files', f);
            await fetch('/api/tasks/attachments/upload', { method: 'POST', body: form });
          }
          // 2) AI dispatch'i tetikle
          await fetch('/api/ai/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: created.id }),
          });
        } catch {
          setError('Ekler yüklenemedi');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      setError('İş oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto relative overflow-visible z-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialData ? 'İş Düzenle' : 'Yeni İş Oluştur'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            İş Başlığı *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="İş başlığını girin"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Açıklama
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="İş açıklamasını girin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Ekleri</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              {files.map((f, i) => (
                <li key={i}>{f.name} ({Math.round(f.size/1024)} KB)</li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri *
            </label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Müşteri seçin</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="system_id" className="block text-sm font-medium text-gray-700 mb-2">
              Sistem *
            </label>
            <select
              id="system_id"
              name="system_id"
              value={formData.system_id}
              onChange={handleChange}
              required
              disabled={!formData.client_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 bg-white text-gray-900 relative z-50"
            >
              <option value="">Sistem seçin</option>
              {systems.map(system => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
              Atanan Kişi *
            </label>
            {session?.user?.role === 'WORKER' ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                {session.user.name} (Kendiniz)
              </div>
            ) : (
              <select
                id="assigned_to"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white relative z-20"
              >
                <option value="">Kişi seçin</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Öncelik
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
              <option value="CRITICAL">Kritik</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Ekler yükleniyor...' : (loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Oluştur'))}
          </button>
        </div>
      </form>
    </div>
  );
});

export default TaskForm;
