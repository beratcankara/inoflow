'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  focusStatus?: 'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED';
  onFocusToggle?: (status: 'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED') => void;
}

const statusConfig = {
  'NOT_STARTED': {
    title: 'Açık İşler',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300'
  },
  'NEW_STARTED': {
    title: 'Geliştirilmeye Hazır',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300'
  },
  'IN_PROGRESS': {
    title: 'Geliştirme Aşamasında',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300'
  },
  'IN_TESTING': {
    title: 'Teste Verilenler',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300'
  },
  'COMPLETED': {
    title: 'Tamamlananlar',
    color: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300'
  }
};

const statusOrder = ['NOT_STARTED', 'NEW_STARTED', 'IN_PROGRESS', 'IN_TESTING', 'COMPLETED'];

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onTaskDelete, focusStatus, onFocusToggle }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showSubtaskModal, setShowSubtaskModal] = useState<{ taskId: string; show: boolean }>({ taskId: '', show: false });
  const [showNoteModal, setShowNoteModal] = useState<{ taskId: string; show: boolean }>({ taskId: '', show: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ taskId: string; taskTitle: string; show: boolean }>({ taskId: '', taskTitle: '', show: false });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubtaskModal({ taskId: '', show: false });
        setShowNoteModal({ taskId: '', show: false });
        setShowDeleteConfirm({ taskId: '', taskTitle: '', show: false });
      }
    };

    if (showSubtaskModal.show || showNoteModal.show || showDeleteConfirm.show) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showSubtaskModal.show, showNoteModal.show, showDeleteConfirm.show]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask) {
      onStatusChange(draggedTask, newStatus);
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '0s';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours}s ${minutes}d ${seconds}sn`;
  };

  const handleCreateSubtask = async (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;

    setLoading(prev => ({ ...prev, [`subtask-${taskId}`]: true }));
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });

      if (response.ok) {
        // Sayıları API'den aldığımız için burada yerel listeyi güncellemiyoruz
        setNewSubtaskTitle('');
        setShowSubtaskModal({ taskId: '', show: false });
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`subtask-${taskId}`]: false }));
    }
  };

  const handleCreateNote = async (taskId: string) => {
    if (!newNoteContent.trim()) return;

    setLoading(prev => ({ ...prev, [`note-${taskId}`]: true }));
    try {
      const response = await fetch(`/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (response.ok) {
        // Sayıları API'den aldığımız için burada yerel listeyi güncellemiyoruz
        setNewNoteContent('');
        setShowNoteModal({ taskId: '', show: false });
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`note-${taskId}`]: false }));
    }
  };


  return (
    <div className="relative flex space-x-6 overflow-x-auto pb-6" style={{ minHeight: '560px' }}>
      {(focusStatus ? [focusStatus] : statusOrder).map((status) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const statusTasks = getTasksByStatus(status);
        
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-80 ${config.color} rounded-lg p-4 ${config.borderColor} border-2`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                className={`font-semibold ${config.textColor} hover:underline`}
                onClick={() => onFocusToggle && onFocusToggle(status as 'NOT_STARTED' | 'NEW_STARTED' | 'IN_PROGRESS' | 'IN_TESTING' | 'COMPLETED')}
                title="Bu sütuna odaklan"
              >
                {config.title}
              </button>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.textColor} ${config.color}`}>
                  {statusTasks.length}
                </span>
                {statusTasks.length > 6 && (
                  <span className={`text-xs ${config.textColor} opacity-75`}>
                    (6+ gösteriliyor)
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3 max-h-[48rem] overflow-y-auto pr-2 kanban-scroll">
              {statusTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{task.title}</h4>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSubtaskModal({ taskId: task.id, show: true });
                        }}
                        className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-1 rounded text-xs transition-all duration-200"
                        title="Subtask Ekle"
                        disabled={loading[`subtask-${task.id}`]}
                      >
                        {loading[`subtask-${task.id}`] ? '⏳' : '✓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNoteModal({ taskId: task.id, show: true });
                        }}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded text-xs transition-all duration-200"
                        title="Not Ekle"
                        disabled={loading[`note-${task.id}`]}
                      >
                        {loading[`note-${task.id}`] ? '⏳' : '📝'}
                      </button>
                      {onTaskDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm({ taskId: task.id, taskTitle: task.title, show: true });
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded text-xs transition-all duration-200"
                          title="İşi Sil"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      {task.client && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                          {task.client.name}
                        </span>
                      )}
                      {task.system && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                          {task.system.name}
                        </span>
                      )}
                      {(() => {
                        const p = task.priority as ('LOW'|'MEDIUM'|'HIGH'|'CRITICAL'|undefined);
                        if (!p) return null;
                        const map: Record<string, string> = {
                          LOW: 'bg-gray-100 text-gray-700',
                          MEDIUM: 'bg-indigo-100 text-indigo-700',
                          HIGH: 'bg-orange-100 text-orange-700',
                          CRITICAL: 'bg-red-100 text-red-700',
                        };
                        const label: Record<string, string> = {
                          LOW: 'Düşük', MEDIUM: 'Orta', HIGH: 'Yüksek', CRITICAL: 'Kritik'
                        };
                        return <span className={`px-2 py-1 rounded ${map[p]}`}>{label[p]}</span>;
                      })()}
                    </div>
                  </div>

                  {/* Subtask ve Not Sayıları */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3 text-gray-500">
                      {typeof task.subtask_count === 'number' && (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600">✓</span>
                          <span>
                            {typeof task.completed_subtask_count === 'number'
                              ? `${task.completed_subtask_count}/${task.subtask_count}`
                              : task.subtask_count}
                          </span>
                        </div>
                      )}
                      {typeof task.note_count === 'number' && (
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-600">📝</span>
                          <span>{task.note_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {task.deadline && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
                      <span>📅 {new Date(task.deadline).toLocaleDateString('tr-TR')}</span>
                      {(() => {
                        const now = new Date();
                        const dl = new Date(String(task.deadline));
                        const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 0 && task.status !== 'COMPLETED') {
                          return <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">Bugün</span>;
                        }
                        if (diffDays === 1 && task.status !== 'COMPLETED') {
                          return <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">1 gün</span>;
                        }
                        if (diffDays > 1 && diffDays <= 3 && task.status !== 'COMPLETED') {
                          return <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{diffDays} gün</span>;
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  
                  {task.duration && (
                    <div className="mt-2 text-xs text-gray-500">
                      ⏱️ {formatDuration(task.duration)}
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {task.assigned_user?.name || 'Atanmamış'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(task.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
              
              {statusTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Bu durumda iş yok
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Subtask Modal */}
      {showSubtaskModal.show && (
        <div 
          className="absolute inset-0 bg-transparent flex items-center justify-center z-30 animate-in fade-in duration-200"
          onClick={() => setShowSubtaskModal({ taskId: '', show: false })}
        >
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alt Görev Ekle</h3>
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Alt görev başlığı..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowSubtaskModal({ taskId: '', show: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleCreateSubtask(showSubtaskModal.taskId)}
                disabled={!newSubtaskTitle.trim() || loading[`subtask-${showSubtaskModal.taskId}`]}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading[`subtask-${showSubtaskModal.taskId}`] ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal.show && (
        <div 
          className="absolute inset-0 bg-transparent flex items-center justify-center z-30 animate-in fade-in duration-200"
          onClick={() => setShowNoteModal({ taskId: '', show: false })}
        >
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Not Ekle</h3>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Notunuzu yazın..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowNoteModal({ taskId: '', show: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => handleCreateNote(showNoteModal.taskId)}
                disabled={!newNoteContent.trim() || loading[`note-${showNoteModal.taskId}`]}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading[`note-${showNoteModal.taskId}`] ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modal'ı */}
      {showDeleteConfirm.show && (
        <div 
          className="absolute inset-0 bg-transparent flex items-center justify-center z-30 animate-in fade-in duration-200"
          onClick={() => setShowDeleteConfirm({ taskId: '', taskTitle: '', show: false })}
        >
          <div 
            className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">İş Sil</h3>
            <p className="text-gray-600 mb-6">
              <strong>&quot;{showDeleteConfirm.taskTitle}&quot;</strong> işini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm({ taskId: '', taskTitle: '', show: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (onTaskDelete) {
                    onTaskDelete(showDeleteConfirm.taskId);
                  }
                  setShowDeleteConfirm({ taskId: '', taskTitle: '', show: false });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
