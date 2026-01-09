'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InlineDatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, note: string) => void;
    buttonRef: HTMLElement | null;
    initialNote?: string;
}

export default function InlineDatePicker({
    isOpen,
    onClose,
    onConfirm,
    buttonRef,
    initialNote = '',
}: InlineDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [note, setNote] = useState<string>(initialNote);

    const popoverRef = useRef<HTMLDivElement>(null);

    // Calculate min and max dates
    const today = new Date().toISOString().split('T')[0];
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const minDate = fifteenDaysAgo.toISOString().split('T')[0];

    // Update note when initialNote changes
    useEffect(() => {
        if (isOpen) {
            setNote(initialNote);
        }
    }, [isOpen, initialNote]);

    // Position popover near the button with smart placement
    useEffect(() => {
        if (isOpen && buttonRef && popoverRef.current) {
            const buttonRect = buttonRef.getBoundingClientRect();
            const popover = popoverRef.current;

            // Wait for next frame to get correct popover dimensions
            setTimeout(() => {
                const popoverHeight = popover.offsetHeight;
                const popoverWidth = popover.offsetWidth;
                const viewportHeight = window.innerHeight;

                // Check if popover would overflow bottom of viewport
                const spaceBelow = viewportHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const shouldPlaceAbove = spaceBelow < popoverHeight && spaceAbove > popoverHeight;

                // Position horizontally (to the left of button)
                popover.style.left = `${buttonRect.left - popoverWidth - 8}px`;

                // Position vertically (smart placement)
                if (shouldPlaceAbove) {
                    // Place above button
                    popover.style.top = `${buttonRect.top - popoverHeight - 8}px`;
                } else {
                    // Place at button level (default)
                    popover.style.top = `${buttonRect.top}px`;
                }
            }, 0);
        }
    }, [isOpen, buttonRef]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                handleConfirm();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, selectedDate]);

    const handleConfirm = () => {
        if (!note.trim()) {
            return; // Don't allow empty notes
        }
        onConfirm(selectedDate, note);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 min-w-[280px]"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Arrow */}
            <div className="absolute top-3 -right-2 w-4 h-4 bg-white border-r border-t border-gray-200 transform rotate-45"></div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-sm">Hangi tarihe kopyalanacak?</span>
                </div>

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    max={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />

                <p className="text-xs text-gray-500">
                    Son 15 gün içinde bir tarih seçin
                </p>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Not
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Yapılan işi detaylı olarak açıklayın..."
                        rows={3}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm placeholder:text-gray-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {note.length} / 2000 karakter
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Kopyala
                    </button>
                </div>
            </div>
        </div>
    );
}
