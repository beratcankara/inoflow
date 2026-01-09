'use client';

import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    onConfirm,
    onCancel,
    type = 'danger',
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: (
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            bgColor: 'bg-red-50',
            buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        },
        warning: {
            icon: (
                <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            bgColor: 'bg-yellow-50',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        },
        info: {
            icon: (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            bgColor: 'bg-blue-50',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        },
    };

    const { icon, bgColor, buttonColor } = typeStyles[type];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter') {
            onConfirm();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`${bgColor} rounded-t-lg p-6 flex justify-center`}>
                    {icon}
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColor}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
