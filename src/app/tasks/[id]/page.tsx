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
  const newNoteEditorRef = useRef<HTMLDivElement | null>(null);
  const [mention, setMention] = useState<{ open: boolean; x: number; y: number; query: string; section: 'USERS'|'TASKS'|'ROOT' } | null>(null);
  const [mentionResults, setMentionResults] = useState<{ users: Array<{id:string;name:string}>; tasks: Array<{id:string;title:string}> }>({ users: [], tasks: [] });
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
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
      setDescriptionDraft(taskData.description || '');

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

  const sanitizeAndNormalizeHtml = (html: string) => {
    // Basit sanitizasyon: script etiketlerini kaldır
    const cleaned = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    // Link normalizasyonu: protokolsüz URL'lere https:// ekle, target/rel ayarla
    const wrap = document.createElement('div');
    wrap.innerHTML = cleaned;
    wrap.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const isProtocol = /^(https?:)?\/\//i.test(href);
      if (!isProtocol && href && !href.startsWith('#') && !href.startsWith('/')) {
        a.setAttribute('href', `https://${href}`);
      }
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    return wrap.innerHTML;
  };

  const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const html = (newNoteEditorRef.current?.innerHTML || '').trim();
    if (!html || html === '<br>' || html === '<div><br></div>') return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: sanitizeAndNormalizeHtml(html) }),
      });

      if (response.ok) {
        const newNote = await response.json();
        // Mentionları yakala: <span class="mention" data-type data-id>@Label</span>
        try {
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          const mentions = Array.from(tmp.querySelectorAll('span.mention')) as Array<HTMLSpanElement>;
          for (const m of mentions) {
            const type = m.getAttribute('data-type');
            const id = m.getAttribute('data-id');
            if (type === 'USER' && id) {
              // Bildirim gönder
              await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  task_id: params.id,
                  receiver_id: id,
                  type: 'TASK_COMMENT',
                  title: 'İşte etiketlendiniz',
                  message: `${session?.user?.name || 'Kullanıcı'} "${task?.title || ''}" işinde sizi etiketledi.`,
                }),
              });
            }
          }
        } catch {}
        setNotes(prev => [...prev, newNote]);
        setNewNoteContent('');
        if (newNoteEditorRef.current) newNoteEditorRef.current.innerHTML = '';
        setShowNoteForm(false);
      } else {
        console.error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // Mention helpers
  const fetchMentionResults = async (q: string) => {
    try {
      const [uRes, tRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch(`/api/tasks?limit=50`, { cache: 'no-store' })
      ]);
      type UserLite = { id: string; name?: string };
      type TaskLite = { id: string; title?: string };
      const uJson: UserLite[] = uRes.ok ? await uRes.json() : [];
      const tJson: TaskLite[] = tRes.ok ? await tRes.json() : [];
      const users = uJson
        .filter((u) => (u.name || '').toLowerCase().includes(q.toLowerCase()))
        .slice(0, 6)
        .map((u) => ({ id: u.id, name: u.name ?? '' }));
      const tasks = tJson
        .filter((t) => (t.title || '').toLowerCase().includes(q.toLowerCase()))
        .slice(0, 6)
        .map((t) => ({ id: t.id, title: t.title ?? '' }));
      setMentionResults({ users, tasks });
      setMentionActiveIndex(0);
    } catch {}
  };

  const insertMentionAtCaret = (type: 'USER'|'TASK', id: string, label: string) => {
    const el = newNoteEditorRef.current;
    if (!el) return;
    const span = document.createElement('span');
    span.className = 'mention';
    span.contentEditable = 'false';
    span.dataset.type = type;
    span.dataset.id = id;
    span.textContent = `@${label}`;
    const space = document.createTextNode('\u00A0');
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Sil: yazılmış olan "@query" metnini
    try {
      const charsToRemove = (mention?.query?.length || 0) + 1; // @ + query
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text;
        const start = Math.max(0, range.startOffset - charsToRemove);
        const delRange = document.createRange();
        delRange.setStart(textNode, start);
        delRange.setEnd(textNode, range.startOffset);
        delRange.deleteContents();
      }
    } catch {}

    range.insertNode(space);
    range.insertNode(span);
    range.setStartAfter(space);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    setMention(null);
    el.focus();
    // İçeriği state'e yaz
    setNewNoteContent(el.innerHTML);
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
    if (!editingNote) return;
    const html = (document.getElementById(`note-editor-${editingNote.id}`)?.innerHTML || '').trim();
    if (!html || html === '<br>' || html === '<div><br></div>') return;

    try {
      const response = await fetch(`/api/tasks/${params.id}/notes?noteId=${editingNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: sanitizeAndNormalizeHtml(html) }),
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
        return 'Açık İşler';
      case 'NEW_STARTED':
        return 'Geliştirilmeye Hazır';
      case 'IN_PROGRESS':
        return 'Geliştirme Aşamasında';
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
                  <option value="NOT_STARTED">Açık İşler</option>
                  <option value="NEW_STARTED">Geliştirilmeye Hazır</option>
                  <option value="IN_PROGRESS">Geliştirme Aşamasında</option>
                  <option value="IN_TESTING">Teste Verilenler</option>
                  <option value="COMPLETED">Tamamlananlar</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-md text-sm">
                  {task.status === 'NOT_STARTED' ? 'Açık İşler' :
                   task.status === 'NEW_STARTED' ? 'Geliştirilmeye Hazır' :
                   task.status === 'IN_PROGRESS' ? 'Geliştirme Aşamasında' :
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
              {editingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/tasks/${params.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ description: descriptionDraft }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setTask(updated);
                            setEditingDescription(false);
                          } else {
                            console.error('Açıklama güncellenemedi');
                          }
                        } catch (e) {
                          console.error('Açıklama güncelleme hatası:', e);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setDescriptionDraft(task.description || '');
                        setEditingDescription(false);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-gray-600 whitespace-pre-wrap flex-1">
                {task.description || 'Açıklama bulunmuyor.'}
              </p>
                  {canEdit() && (
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Açıklamayı düzenle"
                    >
                      ✏️ Düzenle
                    </button>
                  )}
                </div>
              )}
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
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Kalın">B</button>
                      <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 italic" aria-label="İtalik">I</button>
                      <button type="button" onClick={() => document.execCommand('underline')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Altı çizili">U</button>
                      <button type="button" onClick={() => document.execCommand('formatBlock', false, 'h3')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Başlık">H3</button>
                      <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Madde işaretli liste">• Liste</button>
                      <button type="button" onClick={() => document.execCommand('insertOrderedList')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Numaralı liste">1. Liste</button>
                      <button type="button" onClick={() => { const url = prompt('Bağlantı URL'); if (url) { document.execCommand('createLink', false, url); } }} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Bağlantı">Bağlantı</button>
                      <button type="button" onClick={() => { const url = prompt('Görsel URL'); if (url) { document.execCommand('insertImage', false, url); } }} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Görsel">Görsel</button>
                    </div>
                    <div className="relative">
                      <div
                        ref={newNoteEditorRef}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white min-h-24 note-editor"
                        contentEditable
                        suppressContentEditableWarning
                      onKeyDown={async (e) => {
                        if (mention?.open) {
                          if (e.key === 'ArrowDown') { 
                            e.preventDefault(); 
                            const maxIndex = mention.section==='ROOT' ? 1 : (mention.section==='USERS'?mentionResults.users.length:mentionResults.tasks.length) - 1;
                            setMentionActiveIndex((i) => Math.min(i+1, Math.max(0, maxIndex)));
                            return; 
                          }
                          if (e.key === 'ArrowUp') { 
                            e.preventDefault(); 
                            setMentionActiveIndex((i) => Math.max(i-1, 0)); 
                            return; 
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (mention.section === 'ROOT') {
                              if (mentionActiveIndex === 0) {
                                setMention(m => m ? { ...m, section: 'USERS' } : m);
                                fetchMentionResults('');
                              } else {
                                setMention(m => m ? { ...m, section: 'TASKS' } : m);
                                fetchMentionResults('');
                              }
                              setMentionActiveIndex(0);
                              return;
                            }
                            if (mention.section === 'USERS' && mentionResults.users[mentionActiveIndex]) {
                              const u = mentionResults.users[mentionActiveIndex];
                              insertMentionAtCaret('USER', u.id, u.name);
                            } else if (mention.section === 'TASKS' && mentionResults.tasks[mentionActiveIndex]) {
                              const t = mentionResults.tasks[mentionActiveIndex];
                              insertMentionAtCaret('TASK', t.id, t.title);
                            }
                            return;
                          }
                          if (e.key === 'Escape') { setMention(null); return; }
                        }
                        if (e.key === '@') {
                          setTimeout(() => {
                            const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                            const sel = window.getSelection();
                            if (!sel || !sel.rangeCount) return;
                            const range = sel.getRangeAt(0).cloneRange();
                            const marker = document.createElement('span');
                            marker.textContent = '\u200b';
                            range.insertNode(marker);
                            const mRect = marker.getBoundingClientRect();
                            marker.remove();
                            setMention({ open: true, x: mRect.left - rect.left, y: mRect.bottom - rect.top + 22, query: '', section: 'ROOT' });
                          }, 0);
                        }
                      }}
                      onInput={(e) => {
                        const html = (e.target as HTMLDivElement).innerHTML;
                        setNewNoteContent(html);
                        if (mention?.open) {
                          const text = (e.target as HTMLDivElement).innerText;
                          const match = /@([\p{L}0-9 _-]{0,30})$/u.exec(text);
                          if (mention.section !== 'ROOT' && match) {
                            const q = match[1].trim();
                            setMention((m) => m ? { ...m, query: q } : m);
                            fetchMentionResults(q);
                          } else {
                            setMention(null);
                          }
                        }
                      }}
                      />
                      {mention?.open && (
                        <div className={`mention-menu ${mention.section==='ROOT' ? 'root' : ''}`} style={{ left: mention.x, top: mention.y, position: 'absolute' }}>
                          {mention.section === 'ROOT' ? (
                            <>
                              <div className={`item ${mentionActiveIndex===0?'active':''}`} onMouseDown={(e) => { e.preventDefault(); setMention(m => m ? { ...m, section: 'USERS' } : m); fetchMentionResults(''); }}>Kişiler</div>
                              <div className={`item ${mentionActiveIndex===1?'active':''}`} onMouseDown={(e) => { e.preventDefault(); setMention(m => m ? { ...m, section: 'TASKS' } : m); fetchMentionResults(''); }}>İşler</div>
                            </>
                          ) : (
                            <>
                              {mention.section === 'USERS' && (
                                <>
                                  <div className="section-title">Kişiler</div>
                                  {mentionResults.users.map((u, idx) => (
                                    <div key={u.id} className={`item ${mention.section==='USERS' && idx===mentionActiveIndex ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); insertMentionAtCaret('USER', u.id, u.name); }}>
                                      {u.name}
                                    </div>
                                  ))}
                                </>
                              )}
                              {mention.section === 'TASKS' && (
                                <>
                                  <div className="section-title">İşler</div>
                                  {mentionResults.tasks.map((t, idx) => (
                                    <div key={t.id} className={`item ${mention.section==='TASKS' && idx===mentionActiveIndex ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); insertMentionAtCaret('TASK', t.id, t.title); }}>
                                      {t.title}
                                    </div>
                                  ))}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNoteForm(false); if (newNoteEditorRef.current) newNoteEditorRef.current.innerHTML = ''; }}
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
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Kalın">B</button>
                          <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 italic" aria-label="İtalik">I</button>
                          <button type="button" onClick={() => document.execCommand('underline')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Altı çizili">U</button>
                          <button type="button" onClick={() => document.execCommand('formatBlock', false, 'h3')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Başlık">H3</button>
                          <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Madde işaretli liste">• Liste</button>
                          <button type="button" onClick={() => document.execCommand('insertOrderedList')} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Numaralı liste">1. Liste</button>
                          <button type="button" onClick={() => { const url = prompt('Bağlantı URL'); if (url) { document.execCommand('createLink', false, url); } }} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Bağlantı">Bağlantı</button>
                          <button type="button" onClick={() => { const url = prompt('Görsel URL'); if (url) { document.execCommand('insertImage', false, url); } }} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Görsel">Görsel</button>
                        </div>
                        <div
                          id={`note-editor-${editingNote.id}`}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white min-h-20 note-editor"
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: editingNote.content }}
                          autoFocus={true as unknown as boolean}
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
                        <div className="text-gray-900 mb-2 note-content" dangerouslySetInnerHTML={{ __html: note.content }} onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target && target.classList.contains('mention') && target.dataset.type === 'TASK' && target.dataset.id) {
                            router.push(`/tasks/${target.dataset.id}`);
                          }
                        }} />
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
                                  onClick={() => {
                                    const plain = stripHtml(note.content);
                                    setShowDeleteConfirm({ type: 'note', id: note.id, title: (plain.length>30?plain.slice(0,30)+'...':plain) });
                                  }}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ekler</h3>
              {canEdit() && (
                <div className="mb-3">
                  <label className="inline-block text-sm text-gray-600 mr-2">Dosya yükle:</label>
                  <input type="file" multiple onChange={async (e) => {
                    const files = e.target.files; if (!files || files.length===0) return;
                    const form = new FormData(); form.append('taskId', String(params.id));
                    Array.from(files).forEach(f => form.append('files', f));
                    await fetch('/api/tasks/attachments/upload', { method: 'POST', body: form });
                    const attsResponse = await fetch(`/api/tasks/${params.id}/attachments?ts=${Date.now()}`, { cache: 'no-store' });
                    if (attsResponse.ok) setAttachments(await attsResponse.json());
                  }} className="text-sm" />
                </div>
              )}
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
                            {canEdit() && (
                              <button
                                aria-label="Sil"
                                title="Sil"
                                className="text-red-600 hover:text-red-800"
                                onClick={async () => {
                                  await fetch(`/api/tasks/${params.id}/attachments?attId=${att.id}`, { method: 'DELETE' });
                                  setAttachments(prev => prev.filter(a => a.id !== att.id));
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                  <path d="M6 7h12v2H6zM9 9h2v9H9zm4 0h2v9h-2zM8 4h8l1 2H7z"/>
                                </svg>
                              </button>
                            )}
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
