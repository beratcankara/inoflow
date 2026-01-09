'use client';

import React, { useState, useRef } from 'react';
import { ActivityWithRelations } from '@/types/activity';
import { formatMinutes, parseTimeInput } from '@/lib/timeParser';
import InlineDatePicker from './InlineDatePicker';
import EditNoteModal from './EditNoteModal';

interface ActivityTableProps {
    activities: ActivityWithRelations[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (activityId: string, newDate: string, newNote: string) => void;
    onUpdate?: (id: string, updates: { activity_date?: string; time_spent_minutes?: number; note?: string }) => Promise<void>;
    loading?: boolean;
}

export default function ActivityTable({
    activities,
    onEdit,
    onDelete,
    onDuplicate,
    onUpdate,
    loading = false,
}: ActivityTableProps) {
    const [copyPicker, setCopyPicker] = useState<{
        isOpen: boolean;
        activityId: string | null;
        buttonRef: HTMLElement | null;
        activityNote: string;
    }>({ isOpen: false, activityId: null, buttonRef: null, activityNote: '' });

    const handleCopyClick = (activityId: string, note: string, e: React.MouseEvent<HTMLButtonElement>) => {
        setCopyPicker({
            isOpen: true,
            activityId,
            buttonRef: e.currentTarget,
            activityNote: note,
        });
    };

    const handleCopyConfirm = (newDate: string, newNote: string) => {
        if (copyPicker.activityId && onDuplicate) {
            onDuplicate(copyPicker.activityId, newDate, newNote);
        }
        setCopyPicker({ isOpen: false, activityId: null, buttonRef: null, activityNote: '' });
    };

    const handleCopyCancel = () => {
        setCopyPicker({ isOpen: false, activityId: null, buttonRef: null, activityNote: '' });
    };

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{
        activity_date: string;
        time_input: string;
        note: string;
    }>({ activity_date: '', time_input: '', note: '' });
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleEditClick = (activity: ActivityWithRelations) => {
        setEditingId(activity.id);
        setEditValues({
            activity_date: activity.activity_date,
            time_input: formatMinutes(activity.time_spent_minutes),
            note: activity.note,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({ activity_date: '', time_input: '', note: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingId || !onUpdate) return;

        setSaving(true);
        try {
            const timeResult = parseTimeInput(editValues.time_input);
            if (!timeResult.minutes) {
                alert('Geçersiz süre formatı');
                setSaving(false);
                return;
            }

            await onUpdate(editingId, {
                activity_date: editValues.activity_date,
                time_spent_minutes: timeResult.minutes,
                note: editValues.note,
            });

            setEditingId(null);
            setEditValues({ activity_date: '', time_input: '', note: '' });
        } catch (error) {
            console.error('Error updating activity:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleNoteModalSave = (newNote: string) => {
        setEditValues(prev => ({ ...prev, note: newNote }));
    };
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tarih
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Görev
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Firma
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sistem
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Süre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Not
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                    <svg
                        className="w-16 h-16 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Henüz aktivite yok
                    </h3>
                    <p className="text-gray-500">
                        İlk aktivitenizi kaydetmek için &quot;Aktivite Kaydet&quot; butonuna tıklayın
                    </p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const canEdit = (activity: ActivityWithRelations) => {
        const createdAt = new Date(activity.created_at);
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        return createdAt >= fifteenDaysAgo;
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tarih
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Görev
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Firma
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sistem
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Süre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Not
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kullanıcı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {activities.map((activity) => {
                            const editable = canEdit(activity);
                            return (
                                <tr
                                    key={activity.id}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => editable && onEdit && onEdit(activity.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingId === activity.id ? (
                                            <input
                                                type="date"
                                                value={editValues.activity_date}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, activity_date: e.target.value }))}
                                                className="px-2 py-1 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            formatDate(activity.activity_date)
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {activity.task ? (
                                            <>
                                                <div className="font-medium">{activity.task.title}</div>
                                                <div className="text-xs text-gray-500">
                                                    {activity.task.status}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 italic">Görev yok</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {activity.client.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {activity.system.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {editingId === activity.id ? (
                                            <input
                                                type="text"
                                                value={editValues.time_input}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, time_input: e.target.value }))}
                                                placeholder="2h 30m"
                                                className="px-2 py-1 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 text-sm w-24"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            formatMinutes(activity.time_spent_minutes)
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate flex-1">
                                                {editingId === activity.id ? editValues.note : activity.note}
                                            </span>
                                            {editingId === activity.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNoteModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors flex-shrink-0"
                                                    title="Notu Düzenle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {activity.user?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {/* Edit/Save Buttons */}
                                            {editingId === activity.id ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSaveEdit();
                                                        }}
                                                        disabled={saving}
                                                        className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                                                        title="Kaydet"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelEdit();
                                                        }}
                                                        disabled={saving}
                                                        className="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                                                        title="İptal"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : editable ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(activity);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            ) : null}

                                            {/* Copy Button */}
                                            {editingId !== activity.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyClick(activity.id, activity.note, e);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="Kopyala"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Delete Button */}
                                            {editable && editingId !== activity.id ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete && onDelete(activity.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            ) : !editable ? (
                                                <span
                                                    className="text-gray-400 text-xs"
                                                    title="15 günden eski aktiviteler düzenlenemez"
                                                >
                                                    Kilitli
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
                {activities.map((activity) => {
                    const editable = canEdit(activity);
                    return (
                        <div key={activity.id} className="p-4 hover:bg-blue-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {activity.task ? activity.task.title : 'Görev yok'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDate(activity.activity_date)}
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-blue-600">
                                    {formatMinutes(activity.time_spent_minutes)}
                                </div>
                            </div>
                            <div className="text-sm text-gray-700 mb-2">{activity.note}</div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <div>
                                    {activity.client.name} • {activity.system.name}
                                </div>
                                {editable && onDelete && (
                                    <button
                                        onClick={() => onDelete(activity.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Inline Date Picker for Copy */}
            <InlineDatePicker
                isOpen={copyPicker.isOpen}
                onClose={handleCopyCancel}
                onConfirm={handleCopyConfirm}
                buttonRef={copyPicker.buttonRef}
                initialNote={copyPicker.activityNote}
            />

            {/* Edit Note Modal */}
            <EditNoteModal
                isOpen={noteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                onSave={handleNoteModalSave}
                initialNote={editValues.note}
            />
        </div>
    );
}
