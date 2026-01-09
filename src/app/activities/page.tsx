'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import ActivityTable from '@/components/ActivityTable';
import QuickAddActivityModal from '@/components/QuickAddActivityModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExportTemplateModal from '@/components/ExportTemplateModal';
import { formatMinutes } from '@/lib/timeParser';
import { ActivityListResponse, ActivityWithRelations, ActivitySummary } from '@/types/activity';
import { Client } from '@/types';
import { ExportTemplate } from '@/types/exportTemplate';
import { exportActivitiesToExcel } from '@/lib/excelExport';

export default function ActivitiesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [activities, setActivities] = useState<ActivityWithRelations[]>([]);
    const [summary, setSummary] = useState<ActivitySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [dateFrom, setDateFrom] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedSystem, setSelectedSystem] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [systems, setSystems] = useState<any[]>([]);
    const [filteredSystems, setFilteredSystems] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(50);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        activityId: string | null;
    }>({ isOpen: false, activityId: null });

    // Export modal state
    const [exportModalOpen, setExportModalOpen] = useState(false);

    // Filter panel state
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // Calculate active filter count
    const activeFilterCount = [
        selectedClient,
        selectedSystem,
        selectedUser
    ].filter(Boolean).length;

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch clients and systems
    useEffect(() => {
        fetchClients();
        fetchSystems();
        if (session?.user?.role === 'ASSIGNER' || session?.user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [session]);

    // Fetch activities when filters change
    useEffect(() => {
        if (status === 'authenticated') {
            fetchActivities();
        }
    }, [status, dateFrom, dateTo, selectedClient, selectedSystem, selectedUser, currentPage]);

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

    const fetchSystems = async () => {
        try {
            const response = await fetch('/api/systems');
            if (response.ok) {
                const data = await response.json();
                setSystems(data);
            }
        } catch (error) {
            console.error('Error fetching systems:', error);
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

    // Filter systems when client changes
    useEffect(() => {
        if (selectedClient) {
            const filtered = systems.filter(s => s.client_id === selectedClient);
            setFilteredSystems(filtered);
        } else {
            setFilteredSystems(systems);
        }
        // Reset system when client changes
        setSelectedSystem('');
    }, [selectedClient, systems]);

    const handleClientChange = (clientId: string) => {
        setSelectedClient(clientId);
        setCurrentPage(1);
    };

    const handleSystemChange = (systemId: string) => {
        setSelectedSystem(systemId);
        setCurrentPage(1);
    };

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                date_from: dateFrom,
                date_to: dateTo,
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (selectedClient) {
                params.append('client_id', selectedClient);
            }

            if (selectedSystem) {
                params.append('system_id', selectedSystem);
            }

            if (selectedUser) {
                params.append('user_id', selectedUser);
            }

            const response = await fetch(`/api/activities?${params.toString()}`);

            if (response.ok) {
                const data: ActivityListResponse = await response.json();
                setActivities(data.activities);
                setSummary(data.summary);
                setTotalPages(data.pagination.total_pages);
            } else {
                showToast('Aktiviteler yüklenirken bir hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            showToast('Aktiviteler yüklenirken bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteActivity = (id: string) => {
        setDeleteConfirm({ isOpen: true, activityId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.activityId) return;

        try {
            const response = await fetch(`/api/activities/${deleteConfirm.activityId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showToast('Aktivite başarıyla silindi', 'success');
                fetchActivities();
            } else {
                const data = await response.json();
                showToast(data.error || 'Aktivite silinemedi', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            showToast('Aktivite silinirken bir hata oluştu', 'error');
        } finally {
            setDeleteConfirm({ isOpen: false, activityId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, activityId: null });
    };

    const handleActivitySuccess = () => {
        showToast('Aktivite başarıyla kaydedildi', 'success');
        fetchActivities();
    };

    const handleDuplicate = async (activityId: string, newDate: string, newNote: string) => {
        try {
            // Fetch the original activity
            const activity = activities.find(a => a.id === activityId);
            if (!activity) {
                showToast('Aktivite bulunamadı', 'error');
                return;
            }

            // Create duplicate with new date and note
            const duplicateData = {
                client_id: activity.client_id,
                system_id: activity.system_id,
                task_id: activity.task_id || undefined,
                activity_date: newDate,
                time_spent_minutes: activity.time_spent_minutes,
                note: newNote,
            };

            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicateData),
            });

            if (response.ok) {
                showToast('Aktivite başarıyla kopyalandı', 'success');
                fetchActivities();
            } else {
                const data = await response.json();
                showToast(data.error || 'Aktivite kopyalanamadı', 'error');
            }
        } catch (error) {
            console.error('Error duplicating activity:', error);
            showToast('Aktivite kopyalanırken bir hata oluştu', 'error');
        }
    };

    const handleUpdate = async (id: string, updates: { activity_date?: string; time_spent_minutes?: number; note?: string }) => {
        try {
            const response = await fetch(`/api/activities/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                showToast('Aktivite başarıyla güncellendi', 'success');
                fetchActivities();
            } else {
                const data = await response.json();
                showToast(data.error || 'Aktivite güncellenemedi', 'error');
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error updating activity:', error);
            showToast('Aktivite güncellenirken bir hata oluştu', 'error');
            throw error;
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetFilters = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        setDateFrom(date.toISOString().split('T')[0]);
        setDateTo(new Date().toISOString().split('T')[0]);
        setSelectedClient('');
        setSelectedSystem('');
        setSelectedUser('');
        setCurrentPage(1);
    };

    const exportToExcel = () => {
        // Dynamically import xlsx to avoid SSR issues
        import('xlsx').then((XLSX) => {
            // Prepare data
            const headers = ['Tarih', 'Görev', 'Firma', 'Sistem', 'Süre (Saat)', 'Süre (dk)', 'Not'];
            const data = activities.map(activity => [
                activity.activity_date,
                activity.task?.title || 'Görev Yok',
                activity.client?.name || '',
                activity.system?.name || '',
                formatMinutes(activity.time_spent_minutes),
                activity.time_spent_minutes,
                activity.note
            ]);

            // Create workbook and worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

            // Set column widths
            ws['!cols'] = [
                { wch: 12 }, // Tarih
                { wch: 30 }, // Görev
                { wch: 20 }, // Firma
                { wch: 20 }, // Sistem
                { wch: 12 }, // Süre (Saat)
                { wch: 10 }, // Süre (dk)
                { wch: 50 }, // Not
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Aktiviteler');

            // Generate filename
            const filename = `aktiviteler_${dateFrom}_${dateTo}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);

            showToast('Excel dosyası indiriliyor', 'success');
        }).catch(error => {
            console.error('Error exporting to Excel:', error);
            showToast('Excel indirme hatası', 'error');
        });
    };

    const handleExportWithTemplate = async (templateId: string) => {
        try {
            // Fetch template
            const templateResponse = await fetch(`/api/export-templates/${templateId}`);
            if (!templateResponse.ok) {
                showToast('Şablon yüklenemedi', 'error');
                return;
            }

            const template: ExportTemplate = await templateResponse.json();

            // Export using template
            await exportActivitiesToExcel(activities, template);

            showToast('Excel dosyası indiriliyor', 'success');
        } catch (error) {
            console.error('Error exporting:', error);
            showToast('Excel oluşturulamadı', 'error');
        }
    };

    // Quick date preset functions
    const setDatePreset = (preset: 'week' | 'month' | 'thisMonth') => {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];

        let startDate;
        const tempDate = new Date();

        switch (preset) {
            case 'week':
                tempDate.setDate(tempDate.getDate() - 7);
                startDate = tempDate;
                break;
            case 'month':
                tempDate.setDate(tempDate.getDate() - 30);
                startDate = tempDate;
                break;
            case 'thisMonth':
                startDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
                break;
        }

        setDateFrom(startDate!.toISOString().split('T')[0]);
        setDateTo(endDate);
        setCurrentPage(1);
    };


    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Aktiviteler</h1>
                    <p className="text-gray-600">Görevlerde harcanan zamanı takip edin ve raporlayın</p>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    {/* Top Filter Bar */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Date Range - Always Visible */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                            <span className="text-gray-500">→</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                        </div>

                        {/* Filters Toggle Button with Badge */}
                        <button
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            className="relative px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filtreler
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Clear Button */}
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Temizle
                        </button>

                        {/* Right side actions */}
                        <div className="flex gap-2 ml-auto">
                            {/* Şablonlar Button - Only for Assigners and Admins */}
                            {(session?.user?.role === 'ASSIGNER' || session?.user?.role === 'ADMIN') && (
                                <button
                                    onClick={() => router.push('/settings/export-templates')}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Şablonlar
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Aktivite Oluştur
                            </button>
                            <button
                                onClick={() => setExportModalOpen(true)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel İndir
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Filter Panel */}
                    {filtersExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-slideDown">
                            {/* Quick Date Presets */}
                            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                    Hızlı Seçim:
                                </span>
                                <button
                                    onClick={() => setDatePreset('week')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    Son 7 gün
                                </button>
                                <button
                                    onClick={() => setDatePreset('month')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    Son 30 gün
                                </button>
                                <button
                                    onClick={() => setDatePreset('thisMonth')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    Bu ay
                                </button>
                            </div>

                            {/* Advanced Filters Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Client Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📊 Firma
                                    </label>
                                    <select
                                        value={selectedClient}
                                        onChange={(e) => handleClientChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                    >
                                        <option value="" className="text-gray-600">Tümü</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* System Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🖥️ Sistem
                                    </label>
                                    <select
                                        value={selectedSystem}
                                        onChange={(e) => handleSystemChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                        disabled={!selectedClient}
                                    >
                                        <option value="" className="text-gray-600">Tümü</option>
                                        {filteredSystems.map((system) => (
                                            <option key={system.id} value={system.id}>
                                                {system.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* User Filter - Only for Assigners and Admins */}
                                {(session?.user?.role === 'ASSIGNER' || session?.user?.role === 'ADMIN') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            👤 Kullanıcı
                                        </label>
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                        >
                                            <option value="" className="text-gray-600">Tümü</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <SummaryCards summary={summary} loading={loading} />

                {/* Activity Table */}
                <ActivityTable
                    activities={activities}
                    onDelete={handleDeleteActivity}
                    onDuplicate={handleDuplicate}
                    onUpdate={handleUpdate}
                    loading={loading}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Önceki
                        </button>
                        <span className="text-sm text-gray-600">
                            Sayfa {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Add Modal */}
            <QuickAddActivityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleActivitySuccess}
            />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
                    <div
                        className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Aktiviteyi Sil"
                message="Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                type="danger"
            />

            {/* Export Template Modal */}
            <ExportTemplateModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onExport={handleExportWithTemplate}
            />
        </div>
    );
}
