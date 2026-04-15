'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ExportTemplate } from '@/types/exportTemplate';

export default function ExportTemplatesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [templates, setTemplates] = useState<ExportTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        templateId: string | null;
        templateName: string;
    }>({ isOpen: false, templateId: null, templateName: '' });

    // Redirect if not authenticated or not Assigner/Admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (
            status === 'authenticated' &&
            session?.user?.role !== 'ASSIGNER' &&
            session?.user?.role !== 'ADMIN'
        ) {
            router.push('/activities');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchTemplates();
        }
    }, [status]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/export-templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates);
            } else {
                showToast('Şablonlar yüklenemedi', 'error');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            showToast('Bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/export-templates/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('Şablon silindi', 'success');
                fetchTemplates();
            } else {
                const data = await response.json();
                showToast(data.error || 'Şablon silinemedi', 'error');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast('Bir hata oluştu', 'error');
        }
        setDeleteConfirm({ isOpen: false, templateId: null, templateName: '' });
    };

    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetch(`/api/export-templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true })
            });

            if (response.ok) {
                showToast('Varsayılan şablon güncellendi', 'success');
                fetchTemplates();
            } else {
                showToast('Güncellenemedi', 'error');
            }
        } catch (error) {
            console.error('Error setting default:', error);
            showToast('Bir hata oluştu', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Excel Şablonları</h1>
                        <p className="text-gray-600 mt-1">Export şablonlarını yönetin</p>
                    </div>
                    <button
                        onClick={() => router.push('/settings/export-templates/new')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Şablon
                    </button>
                </div>

                {/* Templates Table */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Şablon Adı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Açıklama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Oluşturan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tarih
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Henüz şablon yok. Yeni bir şablon oluşturun.
                                    </td>
                                </tr>
                            ) : (
                                templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {template.name}
                                                </span>
                                                {template.isDefault && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                                                        Varsayılan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate">
                                                {template.description || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {template.createdBy.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {template.config.columns.length} kolon
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                            {!template.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(template.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Varsayılan Yap"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push(`/settings/export-templates/${template.id}/edit`)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Düzenle"
                                            >
                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ isOpen: true, templateId: template.id, templateName: template.name })}
                                                className="text-red-600 hover:text-red-900"
                                                title="Sil"
                                            >
                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Şablonu Sil
                        </h3>
                        <p className="text-gray-600 mb-6">
                            <strong>{deleteConfirm.templateName}</strong> şablonunu silmek istediğinizden emin misiniz?
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setDeleteConfirm({ isOpen: false, templateId: null, templateName: '' })}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => deleteConfirm.templateId && handleDelete(deleteConfirm.templateId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
