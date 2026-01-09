'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import {
    ColumnKey,
    GroupingField,
    MetricType,
    StylePreset,
    TemplateConfig,
    CreateTemplateInput,
    ExportTemplate
} from '@/types/exportTemplate';

const COLUMN_OPTIONS: { key: ColumnKey; label: string }[] = [
    { key: 'date', label: 'Tarih' },
    { key: 'day_name', label: 'Gün' },
    { key: 'week_number', label: 'Hafta' },
    { key: 'task', label: 'Görev' },
    { key: 'task_status', label: 'Görev Durumu' },
    { key: 'client', label: 'Firma' },
    { key: 'system', label: 'Sistem' },
    { key: 'user', label: 'Kullanıcı' },
    { key: 'time_hours', label: 'Süre (Saat)' },
    { key: 'time_minutes', label: 'Süre (Dakika)' },
    { key: 'time_decimal', label: 'Süre (Ondalık)' },
    { key: 'note', label: 'Not' },
    { key: 'created_at', label: 'Oluşturulma Tarihi' }
];

const GROUPING_OPTIONS: { key: GroupingField; label: string }[] = [
    { key: 'client', label: 'Firma' },
    { key: 'system', label: 'Sistem' },
    { key: 'user', label: 'Kullanıcı' },
    { key: 'date', label: 'Tarih' }
];

const METRIC_OPTIONS: { key: MetricType; label: string; category: 'subtotal' | 'grandTotal' }[] = [
    { key: 'total_time', label: 'Toplam Süre', category: 'subtotal' },
    { key: 'activity_count', label: 'Aktivite Sayısı', category: 'subtotal' },
    { key: 'average_time', label: 'Ortalama Süre', category: 'subtotal' },
    { key: 'daily_average', label: 'Günlük Ortalama', category: 'subtotal' },
    { key: 'client_distribution', label: 'Firma Dağılımı (%)', category: 'grandTotal' },
    { key: 'system_distribution', label: 'Sistem Dağılımı (%)', category: 'grandTotal' },
    { key: 'user_distribution', label: 'Kullanıcı Dağılımı (%)', category: 'grandTotal' },
    { key: 'busiest_day', label: 'En Yoğun Gün', category: 'grandTotal' },
    { key: 'slowest_day', label: 'En Boş Gün', category: 'grandTotal' }
];

const STYLE_PRESETS: { key: StylePreset; label: string; description: string }[] = [
    { key: 'professional', label: 'Professional', description: 'Mavi başlık, minimal' },
    { key: 'colorful', label: 'Colorful', description: 'Renkli gruplar' },
    { key: 'minimal', label: 'Minimal', description: 'Sadece yazı' },
    { key: 'corporate', label: 'Corporate', description: 'Şirket renkleri' }
];

export default function TemplateEditorPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const isEdit = params?.id && params.id !== 'new';
    const templateId = isEdit ? params?.id as string : null;

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([
        'date', 'task', 'client', 'system', 'time_hours', 'note'
    ]);
    const [groupingEnabled, setGroupingEnabled] = useState(false);
    const [groupingLevels, setGroupingLevels] = useState<GroupingField[]>([]);
    const [showSubtotals, setShowSubtotals] = useState(true);
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [subtotalMetrics, setSubtotalMetrics] = useState<MetricType[]>(['total_time', 'activity_count']);
    const [grandTotalMetrics, setGrandTotalMetrics] = useState<MetricType[]>(['total_time', 'activity_count']);
    const [stylePreset, setStylePreset] = useState<StylePreset>('professional');

    // Redirect if not authorized
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

    // Load template if editing
    useEffect(() => {
        if (isEdit && templateId) {
            loadTemplate(templateId);
        }
    }, [isEdit, templateId]);

    const loadTemplate = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/export-templates/${id}`);
            if (response.ok) {
                const template: ExportTemplate = await response.json();
                setName(template.name);
                setDescription(template.description || '');
                setIsDefault(template.isDefault);
                setSelectedColumns(template.config.columns);
                setGroupingEnabled(template.config.grouping.enabled);
                setGroupingLevels(template.config.grouping.levels || []);
                setShowSubtotals(template.config.grouping.showSubtotals || true);
                setSortField(template.config.sorting.field);
                setSortOrder(template.config.sorting.order);
                setSubtotalMetrics(template.config.metrics.subtotal);
                setGrandTotalMetrics(template.config.metrics.grandTotal);
                setStylePreset(template.config.styling.preset);
            }
        } catch (error) {
            console.error('Error loading template:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleColumnToggle = (column: ColumnKey) => {
        if (selectedColumns.includes(column)) {
            setSelectedColumns(selectedColumns.filter(c => c !== column));
        } else {
            setSelectedColumns([...selectedColumns, column]);
        }
    };

    const handleGroupingLevelToggle = (level: GroupingField) => {
        if (groupingLevels.includes(level)) {
            setGroupingLevels(groupingLevels.filter(l => l !== level));
        } else {
            setGroupingLevels([...groupingLevels, level]);
        }
    };

    const handleMetricToggle = (metric: MetricType, category: 'subtotal' | 'grandTotal') => {
        if (category === 'subtotal') {
            if (subtotalMetrics.includes(metric)) {
                setSubtotalMetrics(subtotalMetrics.filter(m => m !== metric));
            } else {
                setSubtotalMetrics([...subtotalMetrics, metric]);
            }
        } else {
            if (grandTotalMetrics.includes(metric)) {
                setGrandTotalMetrics(grandTotalMetrics.filter(m => m !== metric));
            } else {
                setGrandTotalMetrics([...grandTotalMetrics, metric]);
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Şablon adı gerekli');
            return;
        }

        if (selectedColumns.length === 0) {
            alert('En az bir kolon seçmelisiniz');
            return;
        }

        const config: TemplateConfig = {
            columns: selectedColumns,
            grouping: {
                enabled: groupingEnabled,
                levels: groupingLevels,
                showSubtotals
            },
            sorting: {
                field: sortField,
                order: sortOrder
            },
            metrics: {
                subtotal: subtotalMetrics,
                grandTotal: grandTotalMetrics
            },
            styling: {
                preset: stylePreset
            },
            conditionalFormat: []
        };

        const data: CreateTemplateInput = {
            name,
            description,
            config,
            isDefault
        };

        setSaving(true);
        try {
            const url = isEdit ? `/api/export-templates/${templateId}` : '/api/export-templates';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                router.push('/settings/export-templates');
            } else {
                const error = await response.json();
                alert(error.error || 'Kaydedilemedi');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Şablon Düzenle' : 'Yeni Şablon'}
                    </h1>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6 space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Şablon Adı *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Örn: Müşteri Raporu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Açıklama
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Şablon hakkında kısa açıklama"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Varsayılan şablon olarak ayarla
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Column Selection */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kolonlar</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {COLUMN_OPTIONS.map((col) => (
                                <label key={col.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(col.key)}
                                        onChange={() => handleColumnToggle(col.key)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Grouping */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gruplama</h2>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={groupingEnabled}
                                    onChange={(e) => setGroupingEnabled(e.target.checked)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Gruplama etkinleştir
                                </label>
                            </div>
                            {groupingEnabled && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {GROUPING_OPTIONS.map((opt) => (
                                            <label key={opt.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={groupingLevels.includes(opt.key)}
                                                    onChange={() => handleGroupingLevelToggle(opt.key)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={showSubtotals}
                                            onChange={(e) => setShowSubtotals(e.target.checked)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Ara toplamları göster
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metrics */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hesaplamalar</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Ara Toplam Metrikleri</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {METRIC_OPTIONS.filter(m => m.category === 'subtotal').map((metric) => (
                                        <label key={metric.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={subtotalMetrics.includes(metric.key)}
                                                onChange={() => handleMetricToggle(metric.key, 'subtotal')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Genel Toplam Metrikleri</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {METRIC_OPTIONS.filter(m => m.category === 'grandTotal').map((metric) => (
                                        <label key={metric.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={grandTotalMetrics.includes(metric.key)}
                                                onChange={() => handleMetricToggle(metric.key, 'grandTotal')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Styling */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stil</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {STYLE_PRESETS.map((style) => (
                                <button
                                    key={style.key}
                                    onClick={() => setStylePreset(style.key)}
                                    className={`p-4 border-2 rounded-lg text-left transition-colors ${stylePreset === style.key
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-medium text-gray-900">{style.label}</div>
                                    <div className="text-sm text-gray-600 mt-1">{style.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end pt-4 border-t">
                        <button
                            onClick={() => router.push('/settings/export-templates')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
