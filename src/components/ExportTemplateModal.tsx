'use client';

import React, { useState, useEffect } from 'react';
import { ExportTemplate, TemplatePreview } from '@/types/exportTemplate';

interface ExportTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (templateId: string) => void;
}

export default function ExportTemplateModal({ isOpen, onClose, onExport }: ExportTemplateModalProps) {
    const [templates, setTemplates] = useState<ExportTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/export-templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates);

                // Auto-select default template
                const defaultTemplate = data.templates.find((t: ExportTemplate) => t.isDefault);
                if (defaultTemplate) {
                    setSelectedTemplate(defaultTemplate.id);
                }
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTemplatePreview = (template: ExportTemplate): TemplatePreview => {
        return {
            columnCount: template.config.columns.length,
            hasGrouping: template.config.grouping.enabled,
            groupLevels: template.config.grouping.levels?.map(level => {
                const labels: Record<string, string> = {
                    client: 'Firma',
                    system: 'Sistem',
                    user: 'Kullanıcı',
                    date: 'Tarih'
                };
                return labels[level] || level;
            }),
            stylePreset: template.config.styling.preset,
            metricsCount: template.config.metrics.subtotal.length + template.config.metrics.grandTotal.length
        };
    };

    const handleExport = () => {
        if (selectedTemplate) {
            onExport(selectedTemplate);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg p-6 max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Excel Şablonu Seçin</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-600">Şablonlar yükleniyor...</div>
                    </div>
                ) : (
                    <>
                        {/* Template Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {templates.map((template) => {
                                const preview = getTemplatePreview(template);
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${selectedTemplate === template.id
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:shadow'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                            {template.isDefault && (
                                                <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded">
                                                    Varsayılan
                                                </span>
                                            )}
                                        </div>

                                        {template.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}

                                        <div className="space-y-1 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>{preview.columnCount} kolon</span>
                                            </div>

                                            {preview.hasGrouping && preview.groupLevels && preview.groupLevels.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                    </svg>
                                                    <span>Gruplu: {preview.groupLevels.join(' → ')}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                                </svg>
                                                <span className="capitalize">{preview.stylePreset}</span>
                                            </div>
                                        </div>

                                        {selectedTemplate === template.id && (
                                            <div className="mt-3 flex items-center gap-2 text-blue-600 font-medium">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Seçili
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-end pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={!selectedTemplate}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel İndir
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
