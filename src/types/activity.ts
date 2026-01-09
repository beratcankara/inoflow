/**
 * Activity Tracking Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the activity tracking system.
 */

import { Task, User, Client, System } from './index';

/**
 * Base Activity interface representing the activities table
 */
export interface Activity {
  id: string;
  task_id: string | null;
  system_id: string;
  user_id: string;
  client_id: string;
  activity_date: string; // ISO date string (YYYY-MM-DD)
  time_spent_minutes: number; // 1-1440 minutes
  note: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Activity with populated related entities (from activity_summary view)
 */
export interface ActivityWithRelations extends Activity {
  task: {
    id: string;
    title: string;
    status: string;
  } | null;
  system: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  client: {
    id: string;
    name: string;
  };
  hours_decimal: number; // Computed: time_spent_minutes / 60
  hours_whole: number; // Computed: floor(time_spent_minutes / 60)
  minutes_remainder: number; // Computed: time_spent_minutes % 60
}

/**
 * Form data for creating/editing activities
 */
export interface ActivityFormData {
  task_id?: string;
  client_id: string;
  system_id: string;
  activity_date: string; // ISO date string
  time_spent_minutes: number;
  note: string;
}

/**
 * Raw form input (before parsing)
 */
export interface ActivityFormInput {
  client_id: string;
  system_id: string;
  task_id: string;
  activity_date: string;
  time_input: string; // Flexible format: "2h 30m", "2.5h", "150m", "2:30"
  note: string;
}

/**
 * Filter parameters for querying activities
 */
export interface ActivityFilters {
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
  client_id?: string;
  system_id?: string;
  user_id?: string;
  task_status?: string[];
  page?: number;
  limit?: number;
}

/**
 * Aggregated activity summary statistics
 */
export interface ActivitySummary {
  total_hours: number; // Sum of all time_spent_minutes / 60
  activity_count: number;
  company_count: number; // Unique client count
}

/**
 * Paginated activity response
 */
export interface ActivityListResponse {
  activities: ActivityWithRelations[];
  summary: ActivitySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Time format options for display
 */
export type TimeDisplayFormat = 'decimal' | 'hours_minutes' | 'minutes';

/**
 * Activity sort options
 */
export type ActivitySortField = 'activity_date' | 'time_spent_minutes' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface ActivitySort {
  field: ActivitySortField;
  order: SortOrder;
}

/**
 * Activity validation result
 */
export interface ActivityValidation {
  valid: boolean;
  errors: {
    task_id?: string;
    activity_date?: string;
    time_spent_minutes?: string;
    note?: string;
  };
}

/**
 * Time input parsing result
 */
export interface ParsedTimeInput {
  minutes: number | null;
  error?: string;
}
