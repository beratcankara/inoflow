import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
    ActivityWithRelations,
    ActivityListResponse,
    ActivityFormData,
    ActivityFilters,
    ActivitySummary,
} from '@/types/activity';

/**
 * GET /api/activities
 * List activities with role-based filtering and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Parse filter parameters
        const date_from = searchParams.get('date_from');
        const date_to = searchParams.get('date_to');
        const client_id = searchParams.get('client_id');
        const system_id = searchParams.get('system_id');
        const user_id = searchParams.get('user_id');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

        // Build query from activities table with joins
        let query = supabase
            .from('activities')
            .select(`
        *,
        task:tasks(id, title, status),
        system:systems!activities_system_id_fkey(id, name),
        user:users(id, name, email),
        client:clients(id, name)
      `, { count: 'exact' });

        // Role-based filtering
        if (session.user.role === 'WORKER') {
            // Workers can only see their own activities
            query = query.eq('user_id', session.user.id);
        } else if (session.user.role === 'ASSIGNER' || session.user.role === 'ADMIN') {
            // Assigners and Admins can filter by user or see all
            if (user_id) {
                query = query.eq('user_id', user_id);
            }
        }

        // Apply filters
        if (date_from) {
            query = query.gte('activity_date', date_from);
        }

        if (date_to) {
            query = query.lte('activity_date', date_to);
        }

        if (client_id) {
            query = query.eq('client_id', client_id);
        }

        if (system_id) {
            query = query.eq('system_id', system_id);
        }

        // Sorting: newest first
        query = query.order('activity_date', { ascending: false });
        query = query.order('created_at', { ascending: false });

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data: activities, error, count } = await query;

        if (error) {
            console.error('Error fetching activities:', error);
            return NextResponse.json(
                { error: 'Failed to fetch activities' },
                { status: 500 }
            );
        }

        // Calculate summary statistics
        let summaryQuery = supabase
            .from('activities')
            .select('time_spent_minutes, client_id');

        // Apply same role-based filtering for summary
        if (session.user.role === 'WORKER') {
            summaryQuery = summaryQuery.eq('user_id', session.user.id);
        } else if (user_id) {
            summaryQuery = summaryQuery.eq('user_id', user_id);
        }

        // Apply same filters for summary
        if (date_from) summaryQuery = summaryQuery.gte('activity_date', date_from);
        if (date_to) summaryQuery = summaryQuery.lte('activity_date', date_to);
        if (client_id) summaryQuery = summaryQuery.eq('client_id', client_id);

        const { data: summaryData, error: summaryError } = await summaryQuery;

        let summary: ActivitySummary = {
            total_hours: 0,
            activity_count: count || 0,
            company_count: 0,
        };

        if (!summaryError && summaryData) {
            const totalMinutes = summaryData.reduce(
                (sum, activity) => sum + activity.time_spent_minutes,
                0
            );
            summary.total_hours = parseFloat((totalMinutes / 60).toFixed(2));

            const uniqueClients = new Set(summaryData.map((a) => a.client_id));
            summary.company_count = uniqueClients.size;
        }

        const response: ActivityListResponse = {
            activities: (activities || []) as ActivityWithRelations[],
            summary,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in GET /api/activities:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/activities
 * Create a new activity
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { task_id, client_id, system_id, activity_date, time_spent_minutes, note } = body;

        // Validate required fields - either task_id OR (client_id + system_id)
        if (!activity_date || !time_spent_minutes || !note) {
            return NextResponse.json(
                { error: 'Missing required fields: activity_date, time_spent_minutes, note' },
                { status: 400 }
            );
        }

        if (!task_id && (!client_id || !system_id)) {
            return NextResponse.json(
                { error: 'Either task_id or both client_id and system_id are required' },
                { status: 400 }
            );
        }

        // Validate time range
        if (time_spent_minutes <= 0 || time_spent_minutes > 1440) {
            return NextResponse.json(
                { error: 'Time must be between 1 and 1440 minutes' },
                { status: 400 }
            );
        }

        // Validate note length
        if (note.length === 0 || note.length > 2000) {
            return NextResponse.json(
                { error: 'Note must be between 1 and 2000 characters' },
                { status: 400 }
            );
        }

        // Validate date range
        const [year, month, day] = activity_date.split('-').map(Number);
        const activityDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);

        if (activityDate.getTime() > today.getTime()) {
            return NextResponse.json(
                { error: 'Activity date cannot be in the future' },
                { status: 400 }
            );
        }

        if (activityDate.getTime() < fifteenDaysAgo.getTime()) {
            return NextResponse.json(
                { error: 'Activity date cannot be more than 15 days in the past' },
                { status: 400 }
            );
        }

        let activityData: {
            task_id?: string;
            user_id: string;
            client_id: string;
            system_id: string;
            activity_date: string;
            time_spent_minutes: number;
            note: string;
        };

        // If task_id is provided, verify it and extract client/system from task
        if (task_id) {
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .select('id, assigned_to, client_id, system_id')
                .eq('id', task_id)
                .single();

            if (taskError || !task) {
                return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            }

            // Verify task ownership (unless ADMIN)
            if (
                session.user.role !== 'ADMIN' &&
                task.assigned_to !== session.user.id
            ) {
                return NextResponse.json(
                    { error: 'You can only log activities for your own tasks' },
                    { status: 403 }
                );
            }

            activityData = {
                task_id,
                user_id: session.user.id,
                client_id: task.client_id,
                system_id: task.system_id,
                activity_date,
                time_spent_minutes,
                note,
            };
        }
        // Manual activity without task
        else {
            // Verify client exists
            const { data: clientCheck, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('id', client_id!)
                .single();

            if (clientError || !clientCheck) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Verify system exists and belongs to the client
            const { data: systemCheck, error: systemError } = await supabase
                .from('systems')
                .select('id, client_id')
                .eq('id', system_id!)
                .single();

            if (systemError || !systemCheck) {
                return NextResponse.json({ error: 'System not found' }, { status: 404 });
            }

            if (systemCheck.client_id !== client_id) {
                return NextResponse.json(
                    { error: 'System does not belong to the selected client' },
                    { status: 400 }
                );
            }

            activityData = {
                user_id: session.user.id,
                client_id: client_id!,
                system_id: system_id!,
                activity_date,
                time_spent_minutes,
                note,
            };
        }

        const { data: activity, error: insertError } = await supabase
            .from('activities')
            .insert(activityData)
            .select()
            .single();

        if (insertError) {
            console.error('Error creating activity:', insertError);
            return NextResponse.json(
                { error: 'Failed to create activity' },
                { status: 500 }
            );
        }

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/activities:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
