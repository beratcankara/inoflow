'use client';

import React from 'react';
import { ActivitySummary } from '@/types/activity';

interface SummaryCardsProps {
    summary: ActivitySummary | null;
    loading?: boolean;
}

export default function SummaryCards({ summary, loading = false }: SummaryCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                ))}
            </div>
        );
    }

    const totalHours = summary?.total_hours || 0;
    const activityCount = summary?.activity_count || 0;
    const companyCount = summary?.company_count || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Total Hours */}
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Toplam Çalışma Saati</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {totalHours.toFixed(1)}h
                        </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                        <svg
                            className="w-8 h-8 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card 2: Activity Count */}
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Aktivite Sayısı</p>
                        <p className="text-3xl font-bold text-green-600">
                            {activityCount}
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                        <svg
                            className="w-8 h-8 text-green-600"
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
                    </div>
                </div>
            </div>

            {/* Card 3: Company Count */}
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Firma Sayısı</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {companyCount}
                        </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                        <svg
                            className="w-8 h-8 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
