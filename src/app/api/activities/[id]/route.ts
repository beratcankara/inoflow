import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/activities/[id]
 * Get a single activity by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch activity with relations from activities table
        const { data: activity, error } = await supabase
            .from('activities')
            .select(`
        *,
        task:tasks(id, title, status),
        system:systems!activities_system_id_fkey(id, name),
        user:users(id, name, email),
        client:clients(id, name)
      `)
            .eq('id', id)
            .single();

        if (error || !activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Verify access based on role
        if (
            session.user.role === 'WORKER' &&
            activity.user_id !== session.user.id
        ) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json(activity);
    } catch (error) {
        console.error('Error in GET /api/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/activities/[id]
 * Update an activity (within 15-day window unless ADMIN)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { activity_date, time_spent_minutes, note } = body;

        // Fetch existing activity
        const { data: existingActivity, error: fetchError } = await supabase
            .from('activities')
            .select('user_id, created_at')
            .eq('id', id)
            .single();

        if (fetchError || !existingActivity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Verify ownership
        if (existingActivity.user_id !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only edit your own activities' },
                { status: 403 }
            );
        }

        // Check 15-day edit window (unless ADMIN)
        if (session.user.role !== 'ADMIN') {
            const createdAt = new Date(existingActivity.created_at);
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            if (createdAt < fifteenDaysAgo) {
                return NextResponse.json(
                    { error: 'Cannot edit activities older than 15 days' },
                    { status: 403 }
                );
            }
        }

        // Prepare update data
        const updateData: { activity_date?: string; time_spent_minutes?: number; note?: string } = {};

        if (time_spent_minutes !== undefined) {
            if (time_spent_minutes <= 0 || time_spent_minutes > 1440) {
                return NextResponse.json(
                    { error: 'Time must be between 1 and 1440 minutes' },
                    { status: 400 }
                );
            }
            updateData.time_spent_minutes = time_spent_minutes;
        }

        if (note !== undefined) {
            if (note.length === 0 || note.length > 2000) {
                return NextResponse.json(
                    { error: 'Note must be between 1 and 2000 characters' },
                    { status: 400 }
                );
            }
            updateData.note = note;
        }

        if (activity_date !== undefined) {
            // Validate date format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(activity_date)) {
                return NextResponse.json(
                    { error: 'Invalid date format. Use YYYY-MM-DD' },
                    { status: 400 }
                );
            }

            // Parse date in local timezone
            const [year, month, day] = activity_date.split('-').map(Number);
            const activityDate = new Date(year, month - 1, day);
            activityDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (activityDate.getTime() > today.getTime()) {
                return NextResponse.json(
                    { error: 'Activity date cannot be in the future' },
                    { status: 400 }
                );
            }

            // Check 15-day window
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
            fifteenDaysAgo.setHours(0, 0, 0, 0);

            if (activityDate.getTime() < fifteenDaysAgo.getTime()) {
                return NextResponse.json(
                    { error: 'Activity date must be within the last 15 days' },
                    { status: 400 }
                );
            }

            updateData.activity_date = activity_date;
        }

        // Update activity
        const { data: updatedActivity, error: updateError } = await supabase
            .from('activities')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating activity:', updateError);
            return NextResponse.json(
                { error: 'Failed to update activity' },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedActivity);
    } catch (error) {
        console.error('Error in PATCH /api/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/activities/[id]
 * Delete an activity (within 15-day window unless ADMIN)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch existing activity
        const { data: existingActivity, error: fetchError } = await supabase
            .from('activities')
            .select('user_id, created_at')
            .eq('id', id)
            .single();

        if (fetchError || !existingActivity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Verify ownership
        if (existingActivity.user_id !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only delete your own activities' },
                { status: 403 }
            );
        }

        // Check 15-day delete window (unless ADMIN)
        if (session.user.role !== 'ADMIN') {
            const createdAt = new Date(existingActivity.created_at);
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            if (createdAt < fifteenDaysAgo) {
                return NextResponse.json(
                    { error: 'Cannot delete activities older than 15 days' },
                    { status: 403 }
                );
            }
        }

        // Delete activity
        const { error: deleteError } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting activity:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete activity' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error in DELETE /api/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
