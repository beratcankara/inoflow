'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

interface Client {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    description: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'WORKER'
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session?.user?.role !== 'ADMIN') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => {
    if (session && activeTab === 'clients') {
      fetchClients();
    }
    if (session && activeTab === 'users') {
      fetchUsers();
    }
  }, [session, activeTab]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientForm),
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients(prev => [...prev, newClient]);
        setClientForm({ name: '', description: '' });
        setShowClientForm(false);
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        setUserForm({ name: '', email: '', password: '', role: 'WORKER' });
        setShowUserForm(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-gray-600 mt-2">Sistem yönetimi ve konfigürasyon</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kullanıcılar
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Müşteriler
              </button>
              <button
                onClick={() => setActiveTab('systems')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'systems'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sistemler
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Kullanıcı Yönetimi</h3>
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Yeni Kullanıcı Ekle
                  </button>
                </div>

                {showUserForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Yeni Kullanıcı Ekle</h4>
                    <form onSubmit={handleCreateUser} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ad Soyad *
                          </label>
                          <input
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-posta *
                          </label>
                          <input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifre *
                          </label>
                          <input
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol *
                          </label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                          >
                            <option value="WORKER">Çalışan</option>
                            <option value="ASSIGNER">Atayan</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUserForm(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white border rounded-lg">
                  <div className="px-6 py-4 border-b">
                    <h4 className="text-md font-medium text-gray-900">Kullanıcılar</h4>
                  </div>
                  <div className="p-6">
                    {users.length > 0 ? (
                      <div className="space-y-3">
                        {users.map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <h5 className="font-medium text-gray-900">{user.name}</h5>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                user.role === 'ASSIGNER' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role === 'ADMIN' ? 'Admin' :
                                 user.role === 'ASSIGNER' ? 'Atayan' : 'Çalışan'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Henüz kullanıcı eklenmemiş</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Müşteri Yönetimi</h3>
                  <button
                    onClick={() => setShowClientForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Yeni Müşteri Ekle
                  </button>
                </div>
                
                {showClientForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Yeni Müşteri Ekle</h4>
                    <form onSubmit={handleCreateClient} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Müşteri Adı
                        </label>
                        <input
                          type="text"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Açıklama
                        </label>
                        <textarea
                          value={clientForm.description}
                          onChange={(e) => setClientForm({...clientForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClientForm(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white border rounded-lg">
                  <div className="px-6 py-4 border-b">
                    <h4 className="text-md font-medium text-gray-900">Müşteriler</h4>
                  </div>
                  <div className="p-6">
                    {clients.length > 0 ? (
                      <div className="space-y-3">
                        {clients.map((client) => (
                          <div key={client.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <h5 className="font-medium text-gray-900">{client.name}</h5>
                              {client.description && (
                                <p className="text-sm text-gray-500">{client.description}</p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(client.created_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Henüz müşteri eklenmemiş</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'systems' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sistem Yönetimi</h3>
                <p className="text-gray-500">Sistem yönetimi özellikleri yakında eklenecek...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}