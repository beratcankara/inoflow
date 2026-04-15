import ExcelJS from 'exceljs';
import { ActivityWithRelations } from '@/types/activity';
import { ExportTemplate, ColumnKey, GroupingField, MetricType } from '@/types/exportTemplate';
import { formatMinutes } from './timeParser';

interface GroupedData {
    groupKey: string;
    groupLabel: string;
    activities: ActivityWithRelations[];
    level: number;
}

interface MetricResult {
    totalTime: number;
    activityCount: number;
    averageTime: number;
    dailyAverage: number;
}

/**
 * Main export function using ExcelJS for styling support
 */
export async function exportActivitiesToExcel(
    activities: ActivityWithRelations[],
    template: ExportTemplate
): Promise<void> {
    const { config } = template;

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aktiviteler');

    // Build headers
    const headers = buildHeaders(config.columns);
    const headerRow = worksheet.addRow(headers);

    // Style header row
    styleHeaderRow(headerRow, config);

    // Prepare and add data rows
    if (config.grouping.enabled && config.grouping.levels && config.grouping.levels.length > 0) {
        // Grouped export
        const grouped = groupActivities(activities, config.grouping.levels);
        addGroupedRows(worksheet, grouped, config);
    } else {
        // Simple export
        activities.forEach(activity => {
            const rowData = buildActivityRow(activity, config.columns);
            worksheet.addRow(rowData);
        });
    }

    // Add grand total
    if (config.metrics.grandTotal.length > 0) {
        worksheet.addRow([]); // Empty row
        addGrandTotal(worksheet, activities, config.metrics.grandTotal);
    }

    // Set column widths
    setColumnWidths(worksheet, config.columns);

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aktiviteler_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Build column headers
 */
function buildHeaders(columns: ColumnKey[]): string[] {
    const columnLabels: Record<ColumnKey, string> = {
        date: 'Tarih',
        day_name: 'Gün',
        week_number: 'Hafta',
        task: 'Görev',
        task_status: 'Görev Durumu',
        client: 'Firma',
        system: 'Sistem',
        user: 'Kullanıcı',
        time_hours: 'Süre (Saat)',
        time_minutes: 'Süre (dk)',
        time_decimal: 'Süre (Ondalık)',
        note: 'Not',
        created_at: 'Oluşturulma'
    };

    return columns.map(col => columnLabels[col]);
}

/**
 * Style header row
 */
function styleHeaderRow(row: ExcelJS.Row, config: ExportTemplate['config']): void {
    const colors = {
        professional: '3B82F6',
        colorful: 'EC4899',
        corporate: '1E40AF',
        minimal: '6B7280'
    };

    const bgColor = colors[config.styling.preset];

    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + bgColor }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
}

/**
 * Build single activity row
 */
function buildActivityRow(activity: ActivityWithRelations, columns: ColumnKey[]): any[] {
    const getDayName = (date: string): string => {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const d = new Date(date);
        return days[d.getDay()];
    };

    const getWeekNumber = (date: string): number => {
        const d = new Date(date);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const cellValues: Record<ColumnKey, any> = {
        date: activity.activity_date,
        day_name: getDayName(activity.activity_date),
        week_number: getWeekNumber(activity.activity_date),
        task: activity.task?.title || 'Görev Yok',
        task_status: activity.task?.status || '-',
        client: activity.client?.name || '',
        system: activity.system?.name || '',
        user: activity.user?.name || '',
        time_hours: formatMinutes(activity.time_spent_minutes),
        time_minutes: activity.time_spent_minutes,
        time_decimal: (activity.time_spent_minutes / 60).toFixed(2),
        note: activity.note || '',
        created_at: new Date(activity.created_at).toLocaleDateString('tr-TR') + ' ' +
            new Date(activity.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    return columns.map(col => cellValues[col]);
}

/**
 * Group activities by specified levels
 */
function groupActivities(
    activities: ActivityWithRelations[],
    groupLevels: GroupingField[]
): GroupedData[] {
    if (groupLevels.length === 0) return [];

    const firstLevel = groupLevels[0];
    const groups = new Map<string, ActivityWithRelations[]>();

    activities.forEach(activity => {
        let key: string;

        switch (firstLevel) {
            case 'client':
                key = activity.client_id;
                break;
            case 'system':
                key = activity.system_id;
                break;
            case 'user':
                key = activity.user_id;
                break;
            case 'date':
                key = activity.activity_date;
                break;
            default:
                key = 'other';
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(activity);
    });

    const result: GroupedData[] = [];
    groups.forEach((groupActivities, key) => {
        let label: string;
        const firstActivity = groupActivities[0];

        switch (firstLevel) {
            case 'client':
                label = firstActivity.client?.name || 'Bilinmeyen Firma';
                break;
            case 'system':
                label = firstActivity.system?.name || 'Bilinmeyen Sistem';
                break;
            case 'user':
                label = firstActivity.user?.name || 'Bilinmeyen Kullanıcı';
                break;
            case 'date':
                label = firstActivity.activity_date;
                break;
            default:
                label = 'Diğer';
        }

        result.push({
            groupKey: key,
            groupLabel: label,
            activities: groupActivities,
            level: 0
        });
    });

    return result;
}

/**
 * Add grouped rows to worksheet
 */
function addGroupedRows(
    worksheet: ExcelJS.Worksheet,
    groups: GroupedData[],
    config: ExportTemplate['config']
): void {
    groups.forEach(group => {
        // Group header
        const groupRow = worksheet.addRow([group.groupLabel]);
        groupRow.getCell(1).font = { bold: true, size: 12 };
        groupRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };

        // Activities in group
        group.activities.forEach(activity => {
            worksheet.addRow(buildActivityRow(activity, config.columns));
        });

        // Subtotal if enabled
        if (config.grouping.showSubtotals && config.metrics.subtotal.length > 0) {
            const result = calculateMetrics(group.activities);
            config.metrics.subtotal.forEach(metric => {
                const row = worksheet.addRow([
                    `  ${getMetricLabel(metric)}:`,
                    formatMetricValue(metric, result, group.activities)
                ]);
                row.getCell(1).font = { italic: true };
            });
        }

        // Empty row after group
        worksheet.addRow([]);
    });
}

/**
 * Add grand total section
 */
function addGrandTotal(
    worksheet: ExcelJS.Worksheet,
    activities: ActivityWithRelations[],
    metrics: MetricType[]
): void {
    const result = calculateMetrics(activities);

    const titleRow = worksheet.addRow(['═══ GENEL TOPLAM ═══']);
    titleRow.getCell(1).font = { bold: true, size: 14 };

    metrics.forEach(metric => {
        const row = worksheet.addRow([
            '',
            getMetricLabel(metric) + ':',
            formatMetricValue(metric, result, activities)
        ]);
        row.getCell(2).font = { bold: true };
    });
}

/**
 * Set column widths
 */
function setColumnWidths(worksheet: ExcelJS.Worksheet, columns: ColumnKey[]): void {
    const widths: Record<ColumnKey, number> = {
        date: 12,
        day_name: 12,
        week_number: 8,
        task: 30,
        task_status: 15,
        client: 20,
        system: 20,
        user: 20,
        time_hours: 12,
        time_minutes: 10,
        time_decimal: 12,
        note: 50,
        created_at: 18
    };

    columns.forEach((col, index) => {
        worksheet.getColumn(index + 1).width = widths[col];
    });
}

/**
 * Calculate metrics
 */
function calculateMetrics(activities: ActivityWithRelations[]): MetricResult {
    const totalTime = activities.reduce((sum, a) => sum + a.time_spent_minutes, 0);
    const activityCount = activities.length;
    const averageTime = activityCount > 0 ? totalTime / activityCount : 0;

    const uniqueDates = new Set(activities.map(a => a.activity_date));
    const dailyAverage = uniqueDates.size > 0 ? totalTime / uniqueDates.size : 0;

    return {
        totalTime,
        activityCount,
        averageTime,
        dailyAverage
    };
}

/**
 * Get metric label
 */
function getMetricLabel(metric: MetricType): string {
    const labels: Record<MetricType, string> = {
        total_time: 'Toplam Süre',
        activity_count: 'Aktivite Sayısı',
        average_time: 'Ortalama Süre',
        daily_average: 'Günlük Ortalama',
        client_distribution: 'Firma Dağılımı',
        system_distribution: 'Sistem Dağılımı',
        user_distribution: 'Kullanıcı Dağılımı',
        busiest_day: 'En Yoğun Gün',
        slowest_day: 'En Boş Gün'
    };
    return labels[metric];
}

/**
 * Format metric value
 */
function formatMetricValue(metric: MetricType, result: MetricResult, activities?: ActivityWithRelations[]): string {
    switch (metric) {
        case 'total_time':
            return formatMinutes(result.totalTime);
        case 'activity_count':
            return result.activityCount.toString();
        case 'average_time':
            return formatMinutes(Math.round(result.averageTime));
        case 'daily_average':
            return formatMinutes(Math.round(result.dailyAverage));
        case 'client_distribution':
            return activities ? calculateDistribution(activities, 'client') : '-';
        case 'system_distribution':
            return activities ? calculateDistribution(activities, 'system') : '-';
        case 'user_distribution':
            return activities ? calculateDistribution(activities, 'user') : '-';
        case 'busiest_day':
            return activities ? findBusiestDay(activities) : '-';
        case 'slowest_day':
            return activities ? findSlowestDay(activities) : '-';
        default:
            return '-';
    }
}

/**
 * Calculate distribution percentages
 */
function calculateDistribution(
    activities: ActivityWithRelations[],
    field: 'client' | 'system' | 'user'
): string {
    const totals = new Map<string, number>();
    let grandTotal = 0;

    activities.forEach(activity => {
        const time = activity.time_spent_minutes;
        grandTotal += time;

        let key: string;
        switch (field) {
            case 'client':
                key = activity.client?.name || 'Bilinmeyen';
                break;
            case 'system':
                key = activity.system?.name || 'Bilinmeyen';
                break;
            case 'user':
                key = activity.user?.name || 'Bilinmeyen';
                break;
        }

        totals.set(key, (totals.get(key) || 0) + time);
    });

    const sorted = Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return sorted
        .map(([name, time]) => {
            const percentage = ((time / grandTotal) * 100).toFixed(1);
            return `${name}: %${percentage}`;
        })
        .join(', ');
}

/**
 * Find busiest day
 */
function findBusiestDay(activities: ActivityWithRelations[]): string {
    const dayTotals = new Map<string, number>();

    activities.forEach(activity => {
        const date = activity.activity_date;
        dayTotals.set(date, (dayTotals.get(date) || 0) + activity.time_spent_minutes);
    });

    let maxDate = '';
    let maxTime = 0;

    dayTotals.forEach((time, date) => {
        if (time > maxTime) {
            maxTime = time;
            maxDate = date;
        }
    });

    return maxDate ? `${maxDate} (${formatMinutes(maxTime)})` : '-';
}

/**
 * Find slowest day
 */
function findSlowestDay(activities: ActivityWithRelations[]): string {
    const dayTotals = new Map<string, number>();

    activities.forEach(activity => {
        const date = activity.activity_date;
        dayTotals.set(date, (dayTotals.get(date) || 0) + activity.time_spent_minutes);
    });

    let minDate = '';
    let minTime = Infinity;

    dayTotals.forEach((time, date) => {
        if (time < minTime) {
            minTime = time;
            minDate = date;
        }
    });

    return minDate ? `${minDate} (${formatMinutes(minTime)})` : '-';
}
