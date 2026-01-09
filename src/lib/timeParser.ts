/**
 * Time Parsing Utilities
 * 
 * Provides functions for parsing flexible time input formats and formatting
 * time durations for display.
 */

import { ParsedTimeInput } from '@/types/activity';

/**
 * Parse flexible time input formats and convert to minutes
 * 
 * Supported formats:
 * - Decimal hours: "2.5", "0.75", "8.25"
 * - Hours and minutes: "2h 30m", "1h", "45m", "2h30m"
 * - Colon format: "2:30", "1:00"
 * - Minutes only: "150m", "90m"
 * 
 * @param input - Time input string
 * @returns ParsedTimeInput object with minutes or error
 */
export function parseTimeInput(input: string): ParsedTimeInput {
    if (!input || typeof input !== 'string') {
        return { minutes: null, error: 'Time input is required' };
    }

    const trimmed = input.trim().toLowerCase();

    // Pattern 1: Decimal hours (e.g., "2.5", "0.75")
    const decimalHoursMatch = trimmed.match(/^(\d+\.?\d*)$/);
    if (decimalHoursMatch) {
        const hours = parseFloat(decimalHoursMatch[1]);
        if (isNaN(hours) || hours < 0) {
            return { minutes: null, error: 'Invalid number format' };
        }
        const minutes = Math.round(hours * 60);
        return validateMinutes(minutes);
    }

    // Pattern 2: Hours and minutes with 'h' and 'm' (e.g., "2h 30m", "1h", "45m")
    const hoursMinutesMatch = trimmed.match(/^(?:(\d+)h\s*)?(?:(\d+)m)?$/);
    if (hoursMinutesMatch) {
        const hours = parseInt(hoursMinutesMatch[1] || '0', 10);
        const mins = parseInt(hoursMinutesMatch[2] || '0', 10);

        if (hours === 0 && mins === 0) {
            return { minutes: null, error: 'Time must be greater than 0' };
        }

        const totalMinutes = hours * 60 + mins;
        return validateMinutes(totalMinutes);
    }

    // Pattern 3: Colon format (e.g., "2:30", "1:00")
    const colonMatch = trimmed.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
        const hours = parseInt(colonMatch[1], 10);
        const mins = parseInt(colonMatch[2], 10);

        if (mins >= 60) {
            return { minutes: null, error: 'Minutes must be less than 60 in colon format' };
        }

        const totalMinutes = hours * 60 + mins;
        return validateMinutes(totalMinutes);
    }

    // Pattern 4: Minutes only with 'm' suffix (e.g., "150m")
    const minutesOnlyMatch = trimmed.match(/^(\d+)m$/);
    if (minutesOnlyMatch) {
        const mins = parseInt(minutesOnlyMatch[1], 10);
        return validateMinutes(mins);
    }

    return {
        minutes: null,
        error: 'Invalid format. Use: 2.5h, 2h 30m, 2:30, or 150m'
    };
}

/**
 * Validate that minutes are within acceptable range (1-1440)
 */
function validateMinutes(minutes: number): ParsedTimeInput {
    if (minutes <= 0) {
        return { minutes: null, error: 'Time must be greater than 0 minutes' };
    }

    if (minutes > 1440) {
        return { minutes: null, error: 'Time cannot exceed 24 hours (1440 minutes)' };
    }

    return { minutes };
}

/**
 * Format minutes to human-readable string
 * 
 * @param minutes - Number of minutes
 * @param format - Display format
 * @returns Formatted time string
 * 
 * @example
 * formatMinutes(150, 'hours_minutes') // "2h 30m"
 * formatMinutes(150, 'decimal') // "2.5h"
 * formatMinutes(150, 'minutes') // "150m"
 */
export function formatMinutes(
    minutes: number,
    format: 'hours_minutes' | 'decimal' | 'minutes' = 'hours_minutes'
): string {
    if (!minutes || minutes < 0) {
        return '0m';
    }

    switch (format) {
        case 'decimal': {
            const hours = (minutes / 60).toFixed(1);
            // Remove trailing .0 if present
            return hours.endsWith('.0') ? `${Math.floor(minutes / 60)}h` : `${hours}h`;
        }

        case 'minutes':
            return `${minutes}m`;

        case 'hours_minutes':
        default: {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;

            if (hours === 0) {
                return `${mins}m`;
            }

            if (mins === 0) {
                return `${hours}h`;
            }

            return `${hours}h ${mins}m`;
        }
    }
}

/**
 * Validate time input string without parsing
 * 
 * @param input - Time input string
 * @returns True if valid format, false otherwise
 */
export function validateTimeInput(input: string): boolean {
    const result = parseTimeInput(input);
    return result.minutes !== null;
}

/**
 * Convert minutes to decimal hours
 * 
 * @param minutes - Number of minutes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Decimal hours
 */
export function minutesToDecimalHours(minutes: number, decimals: number = 2): number {
    return parseFloat((minutes / 60).toFixed(decimals));
}

/**
 * Get suggested time formats for user hints
 */
export function getTimeFormatHints(): string[] {
    return [
        '2.5h (decimal hours)',
        '2h 30m (hours and minutes)',
        '2:30 (colon format)',
        '150m (minutes only)',
    ];
}

/**
 * Validate activity date is within allowed range (last 15 days, not future)
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Validation result with error message if invalid
 */
export function validateActivityDate(dateString: string): { valid: boolean; error?: string } {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const activityDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(today.getDate() - 15);

    if (isNaN(activityDate.getTime())) {
        return { valid: false, error: 'Invalid date format' };
    }

    if (activityDate.getTime() > today.getTime()) {
        return { valid: false, error: 'Activity date cannot be in the future' };
    }

    if (activityDate.getTime() < fifteenDaysAgo.getTime()) {
        return { valid: false, error: 'Activity date cannot be more than 15 days in the past' };
    }

    return { valid: true };
}
