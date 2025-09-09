'use client';

import { useState } from 'react';
import { formatDateShort, getStatusColor, getStatusText, formatDuration } from '@/lib/utils';

import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  showActions?: boolean;
}

export default function TaskList({ tasks, onTaskClick, onStatusChange, showActions = true }: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_at');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ALL') return true;
    return task.status === filterStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'duration':
        return (a.duration || 0) - (b.duration || 0);
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow relative overflow-visible">
      <div className="p-6 border-b relative overflow-visible z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">İşler</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-40 overflow-visible">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 relative z-50"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="NOT_STARTED">Yapılacaklar</option>
              <option value="NEW_STARTED">Yeni Başlananlar</option>
              <option value="IN_PROGRESS">Devam Edenler</option>
              <option value="IN_TESTING">Teste Verilenler</option>
              <option value="COMPLETED">Tamamlananlar</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 relative z-50"
            >
              <option value="created_at">Oluşturma Tarihi</option>
              <option value="title">Başlık</option>
              <option value="deadline">Deadline</option>
              <option value="duration">Süre</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Henüz iş bulunmuyor
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {task.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Müşteri:</span> {task.client?.name}
                    </div>
                    <div>
                      <span className="font-medium">Sistem:</span> {task.system?.name}
                    </div>
                    <div>
                      <span className="font-medium">Atanan:</span> {task.assigned_user?.name}
                    </div>
                    <div>
                      <span className="font-medium">Oluşturan:</span> {task.creator?.name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 mt-3">
                    <div>
                      <span className="font-medium">Oluşturulma:</span> {formatDateShort(new Date(task.created_at))}
                    </div>
                    {task.deadline && (
                      <div>
                        <span className="font-medium">Deadline:</span> {formatDateShort(new Date(task.deadline))}
                      </div>
                    )}
                    {task.duration && (
                      <div>
                        <span className="font-medium">Süre:</span> {formatDuration(task.duration)}
                      </div>
                    )}
                  </div>
                </div>
                
                {showActions && (
                  <div className="ml-4 flex flex-col gap-2">
                    {task.status === 'NOT_STARTED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'NEW_STARTED');
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors"
                      >
                        Başlat
                      </button>
                    )}
                    
                    {task.status === 'NEW_STARTED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'IN_PROGRESS');
                        }}
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-md transition-colors"
                      >
                        Devam Et
                      </button>
                    )}
                    
                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'IN_TESTING');
                        }}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md transition-colors"
                      >
                        Teste Ver
                      </button>
                    )}
                    
                    {task.status === 'IN_TESTING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'COMPLETED');
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded-md transition-colors"
                      >
                        Tamamla
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
