'use client';

import React, { useState, useEffect } from 'react';
import { ActivityFormInput } from '@/types/activity';
import { Task } from '@/types/task';
import { Client } from '@/types';
import { System } from '@/types';
import { parseTimeInput, formatMinutes, validateActivityDate } from '@/lib/timeParser';

interface QuickAddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuickAddActivityModal({
    isOpen,
    onClose,
    onSuccess,
}: QuickAddActivityModalProps) {
    const [formData, setFormData] = useState<ActivityFormInput>({
        client_id: '',
        system_id: '',
        task_id: '',
        activity_date: new Date().toISOString().split('T')[0],
        time_input: '',
        note: '',
    });

    const [clients, setClients] = useState<Client[]>([]);
    const [systems, setSystems] = useState<System[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [filteredSystems, setFilteredSystems] = useState<System[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingSystems, setLoadingSystems] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [keepOpen, setKeepOpen] = useState(false);

    // Calculate min and max dates
    const today = new Date().toISOString().split('T')[0];
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const minDate = fifteenDaysAgo.toISOString().split('T')[0];

    // Fetch clients on mount
    useEffect(() => {
        if (isOpen) {
            fetchClients();
            fetchSystems();
            fetchTasks();
        }
    }, [isOpen]);

    // Filter systems when client changes
    useEffect(() => {
        if (formData.client_id) {
            const filtered = systems.filter((s) => s.client_id === formData.client_id);
            setFilteredSystems(filtered);
        } else {
            setFilteredSystems([]);
        }
        // Reset system and task when client changes
        setFormData((prev) => ({ ...prev, system_id: '', task_id: '' }));
        setFilteredTasks([]);
    }, [formData.client_id, systems]);

    // Filter tasks when system changes
    useEffect(() => {
        if (formData.system_id) {
            const filtered = tasks.filter((t) => t.system_id === formData.system_id);
            setFilteredTasks(filtered);
        } else {
            setFilteredTasks([]);
        }
        // Reset task when system changes
        setFormData((prev) => ({ ...prev, task_id: '' }));
    }, [formData.system_id, tasks]);

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const response = await fetch('/api/clients');
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchSystems = async () => {
        setLoadingSystems(true);
        try {
            const response = await fetch('/api/systems');
            if (response.ok) {
                const data = await response.json();
                setSystems(data);
            }
        } catch (error) {
            console.error('Error fetching systems:', error);
        } finally {
            setLoadingSystems(false);
        }
    };

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.client_id) {
            newErrors.client_id = 'Lütfen bir firma seçin';
        }

        if (!formData.system_id) {
            newErrors.system_id = 'Lütfen bir sistem seçin';
        }

        // task_id is optional, no validation needed

        if (!formData.activity_date) {
            newErrors.activity_date = 'Lütfen bir tarih seçin';
        } else {
            const dateValidation = validateActivityDate(formData.activity_date);
            if (!dateValidation.valid) {
                newErrors.activity_date = dateValidation.error || 'Geçersiz tarih';
            }
        }

        if (!formData.time_input) {
            newErrors.time_input = 'Lütfen çalışma süresini girin';
        } else {
            const timeResult = parseTimeInput(formData.time_input);
            if (timeResult.error) {
                newErrors.time_input = timeResult.error;
            }
        }

        if (!formData.note || formData.note.trim().length === 0) {
            newErrors.note = 'Lütfen bir açıklama girin';
        } else if (formData.note.length > 2000) {
            newErrors.note = 'Açıklama en fazla 2000 karakter olabilir';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const timeResult = parseTimeInput(formData.time_input);
            if (!timeResult.minutes) {
                setErrors({ time_input: 'Geçersiz süre formatı' });
                setLoading(false);
                return;
            }

            const payload: {
                client_id: string;
                system_id: string;
                task_id?: string;
                activity_date: string;
                time_spent_minutes: number;
                note: string;
            } = {
                client_id: formData.client_id,
                system_id: formData.system_id,
                activity_date: formData.activity_date,
                time_spent_minutes: timeResult.minutes,
                note: formData.note.trim(),
            };

            // Only include task_id if it's selected
            if (formData.task_id) {
                payload.task_id = formData.task_id;
            }

            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                setErrors({ submit: error.error || 'Aktivite kaydedilemedi' });
                setLoading(false);
                return;
            }

            // Success
            if (keepOpen) {
                // Reset form but keep client and system selected
                setFormData({
                    client_id: formData.client_id,
                    system_id: formData.system_id,
                    task_id: '',
                    activity_date: new Date().toISOString().split('T')[0],
                    time_input: '',
                    note: '',
                });
                setErrors({});
            } else {
                handleClose();
            }

            onSuccess();
        } catch (error) {
            console.error('Error creating activity:', error);
            setErrors({ submit: 'Bir hata oluştu' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            client_id: '',
            system_id: '',
            task_id: '',
            activity_date: new Date().toISOString().split('T')[0],
            time_input: '',
            note: '',
        });
        setErrors({});
        setKeepOpen(false);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit(e as any);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Aktivite Kaydet</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tarih <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.activity_date}
                            onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                            min={minDate}
                            max={today}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.activity_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.activity_date && (
                            <p className="text-red-500 text-sm mt-1">{errors.activity_date}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">Son 15 gün içinde bir tarih seçin</p>
                    </div>

                    {/* Client */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Firma <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            disabled={loadingClients}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.client_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="" className="text-gray-600">
                                {loadingClients ? 'Yükleniyor...' : 'Firma seçin...'}
                            </option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                        {errors.client_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>
                        )}
                    </div>

                    {/* System */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sistem <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.system_id}
                            onChange={(e) => setFormData({ ...formData, system_id: e.target.value })}
                            disabled={!formData.client_id || loadingSystems}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.system_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="" className="text-gray-600">
                                {!formData.client_id
                                    ? 'Önce firma seçin...'
                                    : loadingSystems
                                        ? 'Yükleniyor...'
                                        : 'Sistem seçin...'}
                            </option>
                            {filteredSystems.map((system) => (
                                <option key={system.id} value={system.id}>
                                    {system.name}
                                </option>
                            ))}
                        </select>
                        {errors.system_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.system_id}</p>
                        )}
                        {formData.client_id && filteredSystems.length === 0 && !loadingSystems && (
                            <p className="text-gray-500 text-xs mt-1">Bu firmaya ait sistem bulunamadı</p>
                        )}
                    </div>

                    {/* Task (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Görev <span className="text-gray-400 text-xs">(Opsiyonel)</span>
                        </label>
                        <select
                            value={formData.task_id}
                            onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                            disabled={!formData.system_id || loadingTasks}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                            <option value="" className="text-gray-600">
                                {!formData.system_id
                                    ? 'Önce sistem seçin...'
                                    : loadingTasks
                                        ? 'Yükleniyor...'
                                        : 'Görev seçin (isteğe bağlı)...'}
                            </option>
                            {filteredTasks.map((task) => (
                                <option key={task.id} value={task.id}>
                                    {task.title} ({task.status})
                                </option>
                            ))}
                        </select>
                        {formData.system_id && filteredTasks.length === 0 && !loadingTasks && (
                            <p className="text-gray-500 text-xs mt-1">Bu sisteme ait görev bulunamadı</p>
                        )}
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Çalışma Süresi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.time_input}
                            onChange={(e) => setFormData({ ...formData, time_input: e.target.value })}
                            placeholder="Örn: 2h 30m, 2.5h, 150m, 2:30"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600 text-gray-900 ${errors.time_input ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.time_input && (
                            <p className="text-red-500 text-sm mt-1">{errors.time_input}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Formatlar: 2.5h, 2h 30m, 150m, 2:30
                        </p>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Yapılan işi detaylı olarak açıklayın..."
                            rows={4}
                            maxLength={2000}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600 text-gray-900 ${errors.note ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.note && (
                            <p className="text-red-500 text-sm mt-1">{errors.note}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            {formData.note.length} / 2000 karakter
                        </p>
                    </div>

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={keepOpen}
                                onChange={(e) => setKeepOpen(e.target.checked)}
                                className="mr-2"
                            />
                            Kaydettikten sonra açık tut
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet (Ctrl+Enter)'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
