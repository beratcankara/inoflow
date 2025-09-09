'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { Task, Subtask, Note } from '@/types/task';

export default function TaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [statusLogs, setStatusLogs] = useState<Array<{ id: string; from_status: string | null; to_status: string; created_at: string; user?: { id: string; name: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<Array<{ id: string; file_name: string; mime_type: string; size_bytes: number; public_url?: string | null; storage_path: string; created_at: string }>>([]);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [preview, setPreview] = useState<{ id: string; url: string; mime: string; title: string } | null>(null);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'subtask' | 'note' | 'task', id: string, title: string } | null>(null);
  const attachmentsRef = useRef<HTMLDivElement | null>(null);
  const logsRef = useRef<HTMLDivElement | null>(null);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const attachmentsFetchStartedRef = useRef(false);
  const logsFetchStartedRef = useRef(false);

  // Düzenleme yetkisi kontrolü
  const canEdit = () => {
    if (!session || !task) return false;

    // Admin her zaman düzenleyebilir
    if (session.user.role === 'ADMIN') return true;

    // Worker: kendine atanan işler
    if (session.user.role === 'WORKER') {
      return task.assigned_to === session.user.id;
    }

    // Assigner: kendine atanan VEYA kendisinin oluşturduğu işler
    if (session.user.role === 'ASSIGNER') {
      return task.assigned_to === session.user.id || task.created_by === session.user.id;
    }

    return false;
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  useEffect(() => {
    if (session && params.id) {
      fetchTaskDetails();
    }
  }, [session, params.id]);

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDeleteConfirm(null);
        setEditingSubtask(null);
        setEditingNote(null);
      }
    };

    if (showDeleteConfirm || editingSubtask || editingNote) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showDeleteConfirm, editingSubtask, editingNote]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      // İş detayını hızlıca getir
      const taskPromise = fetch(`/api/tasks/${params.id}`, { cache: 'no-store' });
      const [taskResponse] = await Promise.all([taskPromise]);
      if (!taskResponse.ok) {
        console.error('Failed to fetch task details');
        router.push('/tasks');
        return;
      }
      const taskData = await taskResponse.json();
      setTask(taskData);

      // Subtask ve notları paralel çek (ilk render sonrası)
      Promise.all([
        fetch(`/api/tasks/${params.id}/subtasks`, { cache: 'no-store' }),
        fetch(`/api/tasks/${params.id}/notes`, { cache: 'no-store' }),
      ]).then(async ([subtasksResponse, notesResponse]) => {
        if (subtasksResponse.ok) setSubtasks(await subtasksResponse.json());
        if (notesResponse.ok) setNotes(await notesResponse.json());
      }).catch(() => {});
    } catch (error) {
      console.error('Error fetching task details:', error);
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    if (attachmentsFetchStartedRef.current || attachmentsLoaded) return;
    attachmentsFetchStartedRef.current = true;
    try {
      const attsResponse = await fetch(`/api/tasks/${params.id}/attachments?ts=${Date.now()}`, { cache: 'no-store' });
      if (attsResponse.ok) {
        setAttachments(await attsResponse.json());
      }
    } finally {
      setAttachmentsLoaded(true);
    }
  };

  const fetchStatusLogs = async () => {
    if (logsFetchStartedRef.current || logsLoaded) return;
    logsFetchStartedRef.current = true;
    const logsResponse = await fetch(`/api/tasks/${params.id}/status-logs`, { cache: 'no-store' });
    if (logsResponse.ok) setStatusLogs(await logsResponse.json());
    setLogsLoaded(true);
  };

  // attachments ve status-logs'u görünürlükte (veya zaman aşımıyla) yükle
  useEffect(() => {
    if (!params.id) return;
    const observers: IntersectionObserver[] = [];

    if (attachmentsRef.current && !attachmentsLoaded) {
      const ob = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !attachmentsLoaded) {
            fetchAttachments();
          }
        });
      }, { root: null, rootMargin: '1000px', threshold: 0.01 });
      ob.observe(attachmentsRef.current);
      observers.push(ob);
      // Fallback: görünürlük tetiklenmezse 2sn sonra yükle
      const t = setTimeout(fetchAttachments, 2000);
      observers.push({ disconnect: () => clearTimeout(t) } as unknown as IntersectionObserver);
    }

    if (logsRef.current && !logsLoaded) {
      const ob2 = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !logsLoaded) {
            fetchStatusLogs();
          }
        });
      }, { root: null, rootMargin: '1000px', threshold: 0.01 });
      ob2.observe(logsRef.current);
      observers.push(ob2);
      // Fallback: görünürlük tetiklenmezse 2sn sonra yükle
      const t2 = setTimeout(fetchStatusLogs, 2000);
      observers.push({ disconnect: () => clearTimeout(t2) } as unknown as IntersectionObserver);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [params.id, attachmentsLoaded, logsLoaded]);

  // Son çare: sayfa yüklendikten kısa süre sonra mutlaka bir kez dene
  useEffect(() => {
    if (!params.id) return;
    const t = setTimeout(() => {
      fetchAttachments();
      fetchStatusLogs();
    }, 1500);
    return () => clearTimeout(t);
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        // Değişim sonrası logları tazele
        fetch(`/api/tasks/${params.id}/status-logs`).then(async r => {
          if (r.ok) setStatusLogs(await r.json());
        });
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskTitle('');
        setShowSubtaskForm(false);
      } else {
        console.error('Failed to create subtask');
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const updatedSubtask = await response.json();
        setSubtasks(prev => prev.map(subtask => 
          subtask.id === subtaskId ? updatedSubtask : subtask
        ));
      } else {
        console.error('Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes(prev => [...prev, newNote]);
        setNewNoteContent('');
        setShowNoteForm(false);
      } else {
        console.error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // Subtask silme
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
        setShowDeleteConfirm(null);
      } else {
        console.error('Failed to delete subtask');
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  // Not silme
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setShowDeleteConfirm(null);
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Subtask düzenleme
  const handleEditSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtask || !editingSubtask.title.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/subtasks/${editingSubtask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingSubtask.title }),
      });

      if (response.ok) {
        const updatedSubtask = await response.json();
        setSubtasks(prev => prev.map(subtask => 
          subtask.id === editingSubtask.id ? updatedSubtask : subtask
        ));
        setEditingSubtask(null);
      } else {
        console.error('Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  // Not düzenleme
  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.content.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/notes?noteId=${editingNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editingNote.content }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id ? updatedNote : note
        ));
        setEditingNote(null);
      } else {
        console.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // İş silme
  const handleDeleteTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/tasks');
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-700';
      case 'NEW_STARTED':
        return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_TESTING':
        return 'bg-purple-100 text-purple-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Yapılacaklar';
      case 'NEW_STARTED':
        return 'Yeni Başlananlar';
      case 'IN_PROGRESS':
        return 'Devam Edenler';
      case 'IN_TESTING':
        return 'Teste Verilenler';
      case 'COMPLETED':
        return 'Tamamlananlar';
      default:
        return status;
    }
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

  if (!session || !task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Geri Dön
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-gray-600 mt-2">
                {task.client?.name} - {task.system?.name}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              
              {/* İş silme butonu - sadece yetkili kullanıcılara göster */}
              {(session.user.role === 'ADMIN' || 
                (session.user.role === 'WORKER' && task.created_by === session.user.id) ||
                (session.user.role === 'ASSIGNER' && task.created_by === session.user.id)) && (
                <button
                  onClick={() => setShowDeleteConfirm({ 
                    type: 'task', 
                    id: task.id, 
                    title: task.title 
                  })}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105"
                >
                  İşi Sil
                </button>
              )}
              
              {canEdit() ? (
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NOT_STARTED">Yapılacaklar</option>
                  <option value="NEW_STARTED">Yeni Başlananlar</option>
                  <option value="IN_PROGRESS">Devam Edenler</option>
                  <option value="IN_TESTING">Teste Verilenler</option>
                  <option value="COMPLETED">Tamamlananlar</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-md text-sm">
                  {task.status === 'NOT_STARTED' ? 'Yapılacaklar' :
                   task.status === 'NEW_STARTED' ? 'Yeni Başlananlar' :
                   task.status === 'IN_PROGRESS' ? 'Devam Edenler' :
                   task.status === 'IN_TESTING' ? 'Teste Verilenler' : 'Tamamlananlar'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* İş Açıklaması */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Açıklama</h2>
              <p className="text-gray-600">
                {task.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>

            {/* Subtasklar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Alt Görevler</h2>
                {canEdit() && (
                  <button
                    onClick={() => setShowSubtaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    + Alt Görev Ekle
                  </button>
                )}
              </div>

              {showSubtaskForm && (
                <form onSubmit={handleCreateSubtask} className="mb-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Alt görev başlığı..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubtaskForm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md group">
                    {canEdit() ? (
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    ) : (
                      <div className={`h-4 w-4 rounded border-2 ${subtask.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                        {subtask.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                    )}
                    {editingSubtask?.id === subtask.id ? (
                      <form onSubmit={handleEditSubtask} className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          value={editingSubtask.title}
                          onChange={(e) => setEditingSubtask({...editingSubtask, title: e.target.value})}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubtask(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {subtask.title}
                        </span>
                        {canEdit() && (
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingSubtask(subtask)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Düzenle"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'subtask', id: subtask.id, title: subtask.title })}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(subtask.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                
                {subtasks.length === 0 && (
                  <p className="text-gray-500 text-sm">Henüz alt görev eklenmemiş.</p>
                )}
              </div>
            </div>

            {/* Notlar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Notlar</h2>
                {canEdit() && (
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    + Not Ekle
                  </button>
                )}
              </div>

              {showNoteForm && (
                <form onSubmit={handleCreateNote} className="mb-4">
                  <div className="space-y-2">
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Notunuzu yazın..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNoteForm(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-md group">
                    {editingNote?.id === note.id ? (
                      <form onSubmit={handleEditNote} className="space-y-2">
                        <textarea
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                          rows={3}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                          >
                            ✓ Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNote(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          >
                            ✕ İptal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-gray-900 mb-2">{note.content}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{note.author?.name || 'Bilinmeyen'}</span>
                          <div className="flex items-center space-x-2">
                            <span>{new Date(note.created_at).toLocaleDateString('tr-TR')}</span>
                            {canEdit() && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                  onClick={() => setEditingNote(note)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                  title="Düzenle"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: 'note', id: note.id, title: note.content.substring(0, 30) + '...' })}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Sil"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {notes.length === 0 && (
                  <p className="text-gray-500 text-sm">Henüz not eklenmemiş.</p>
                )}
              </div>
            </div>
          </div>

          {/* Yan Panel */}
          <div className="space-y-6">
            {/* Ekler */}
            <div ref={attachmentsRef} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ekler</h3>
              {!attachmentsLoaded ? (
                <div className="space-y-2">
                  <div className="h-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-24 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">Eklenti bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {attachments.map((att) => {
                    const url = att.public_url || '';
                    const mime = att.mime_type || '';
                    const isImage = mime.startsWith('image/');
                    const isPdf = mime === 'application/pdf';
                    const isDoc = mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    const officeUrl = isDoc ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}` : '';
                    return (
                      <div key={att.id} className="border rounded-md p-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-800 truncate" title={att.file_name}>{att.file_name}</div>
                          <div className="flex items-center space-x-3">
                            {/* Fullscreen icon button */}
                            <button
                              aria-label="Tam ekran"
                              title="Tam ekran"
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => setPreview({ id: att.id, url: isDoc ? officeUrl : url, mime: mime, title: att.file_name })}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M4 9V4h5V2H2v7h2zm15-7h-7v2h5v5h2V2zM4 15H2v7h7v-2H4v-5zm18 0h-2v5h-5v2h7v-7z"/>
                              </svg>
                            </button>
                            {/* Download/Open icon */}
                            <a href={url || '#'} target="_blank" aria-label="Yeni sekmede aç" title="Yeni sekmede aç" className="text-gray-600 hover:text-gray-900">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                        {isImage && url && (
                          <img src={url} alt={att.file_name} className="w-full rounded" />
                        )}
                        {isPdf && url && (
                          <iframe src={url} className="w-full h-64 border rounded" />
                        )}
                        {isDoc && url && (
                          <iframe src={officeUrl} className="w-full h-64 border rounded" />
                        )}
                        {!isImage && !isPdf && !isDoc && (
                          <div className="text-xs text-gray-500">Önizleme desteklenmiyor.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Durum Geçmişi */}
            <div ref={logsRef} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Durum Geçmişi</h3>
              <div className="space-y-3">
                {!logsLoaded ? (
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : statusLogs.length > 0 ? (
                  statusLogs
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((log) => (
                      <div key={log.id} className="text-sm text-gray-700 flex items-center justify-between">
                        <span>
                          {log.from_status ? getStatusText(log.from_status) : '—'} → <strong>{getStatusText(log.to_status)}</strong>
                          {log.user?.name ? ` • ${log.user.name}` : ''}
                        </span>
                        <span className="text-gray-500">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">Henüz durum geçmişi yok.</p>
                )}
              </div>
            </div>
            {/* İş Bilgileri */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">İş Bilgileri</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Atanan:</span>
                  <p className="text-gray-900">{task.assigned_user?.name || 'Atanmamış'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Oluşturan:</span>
                  <p className="text-gray-900">{task.creator?.name || 'Bilinmeyen'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Oluşturulma:</span>
                  <p className="text-gray-900">{new Date(task.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                {task.deadline && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Deadline:</span>
                    <p className="text-gray-900">{new Date(task.deadline).toLocaleDateString('tr-TR')}</p>
                  </div>
                )}
                {task.duration && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Süre:</span>
                    <p className="text-gray-900">
                      {Math.floor(task.duration / 3600)}s {Math.floor((task.duration % 3600) / 60)}d
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Silme Onay Modal'ı */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-transparent flex items-center justify-center z-30 animate-in fade-in duration-200"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {showDeleteConfirm.type === 'subtask' ? 'Alt Görev Sil' : 
               showDeleteConfirm.type === 'note' ? 'Not Sil' : 'İş Sil'}
            </h3>
            <p className="text-gray-600 mb-6">
              <strong>&quot;{showDeleteConfirm.title}&quot;</strong> {
                showDeleteConfirm.type === 'subtask' ? 'alt görevini' : 
                showDeleteConfirm.type === 'note' ? 'notunu' : 'işini'
              } silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === 'subtask') {
                    handleDeleteSubtask(showDeleteConfirm.id);
                  } else if (showDeleteConfirm.type === 'note') {
                    handleDeleteNote(showDeleteConfirm.id);
                  } else if (showDeleteConfirm.type === 'task') {
                    handleDeleteTask();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tam ekran önizleme */}
      {preview && (
        <div
          className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white w-[92vw] h-[88vh] max-w-6xl rounded-lg shadow-2xl overflow-hidden transform transition-all duration-300 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="text-sm font-medium text-gray-800 truncate" title={preview.title}>{preview.title}</div>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-600 hover:text-gray-900 text-sm px-2 py-1"
              >
                Kapat ✕
              </button>
            </div>
            <div className="w-full h-full">
              {preview.mime.startsWith('image/') ? (
                <img src={preview.url} alt={preview.title} className="w-full h-full object-contain bg-gray-50" />
              ) : (
                <iframe src={preview.url} className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
