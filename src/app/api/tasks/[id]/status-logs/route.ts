import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Yetki: mevcut task'ı alıp aynı denetimleri yapmak isterseniz ek kontrol eklenebilir.
    const { data: logs, error } = await supabase
      .from('task_status_logs')
      .select(`
        id,
        task_id,
        user_id,
        from_status,
        to_status,
        created_at,
        user:users!user_id(id,name)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task status logs:', error);
      return NextResponse.json({ error: 'Failed to fetch task status logs' }, { status: 500 });
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching task status logs:', error);
    return NextResponse.json({ error: 'Failed to fetch task status logs' }, { status: 500 });
  }
}


