export type ColumnKey =
    | 'date'
    | 'day_name'
    | 'week_number'
    | 'task'
    | 'task_status'
    | 'client'
    | 'system'
    | 'user'
    | 'time_hours'
    | 'time_minutes'
    | 'time_decimal'
    | 'note'
    | 'created_at';

export type GroupingField = 'client' | 'system' | 'user' | 'date';

export type MetricType =
    | 'total_time'
    | 'activity_count'
    | 'average_time'
    | 'daily_average'
    | 'client_distribution'
    | 'system_distribution'
    | 'user_distribution'
    | 'busiest_day'
    | 'slowest_day';

export type StylePreset = 'professional' | 'colorful' | 'minimal' | 'corporate';

export type ConditionType = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';

export interface ConditionalFormatRule {
    field: ColumnKey;
    condition: ConditionType;
    value: string | number;
    style: {
        backgroundColor?: string;
        fontColor?: string;
        bold?: boolean;
    };
}

export interface TemplateConfig {
    columns: ColumnKey[];
    grouping: {
        enabled: boolean;
        levels?: GroupingField[];
        showSubtotals?: boolean;
    };
    sorting: {
        field: string;
        order: 'asc' | 'desc';
    };
    metrics: {
        subtotal: MetricType[];
        grandTotal: MetricType[];
    };
    styling: {
        preset: StylePreset;
        primaryColor?: string;
    };
    conditionalFormat: ConditionalFormatRule[];
}

export interface ExportTemplate {
    id: string;
    name: string;
    description: string | null;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
    isDefault: boolean;
    config: TemplateConfig;
}

export interface TemplatePreview {
    columnCount: number;
    hasGrouping: boolean;
    groupLevels?: string[];
    stylePreset: StylePreset;
    metricsCount: number;
}

export interface CreateTemplateInput {
    name: string;
    description?: string;
    config: TemplateConfig;
    isDefault?: boolean;
}

export interface UpdateTemplateInput {
    name?: string;
    description?: string;
    config?: TemplateConfig;
    isDefault?: boolean;
}

export interface ExportFilters {
    dateFrom: string;
    dateTo: string;
    clientId?: string;
    systemId?: string;
    userId?: string;
}
