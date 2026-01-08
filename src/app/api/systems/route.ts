import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let query = supabase
      .from('systems')
      .select('*')
      .order('name', { ascending: true });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: systems, error } = await query;

    if (error) {
      console.error('Error fetching systems:', error);
      return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
    }

    return NextResponse.json(systems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin, Assigner ve Worker sistem oluşturabilir
    // (Artık Worker'lar da müşteri/sistem ekleyip düzenleyebilir)

    const body = await request.json();
    const { data: system, error } = await supabase
      .from('systems')
      .insert({
        name: body.name,
        description: body.description,
        client_id: body.client_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating system:', error);
      return NextResponse.json({ error: 'Failed to create system' }, { status: 500 });
    }

    return NextResponse.json(system);
  } catch (error) {
    console.error('Error creating system:', error);
    return NextResponse.json({ error: 'Failed to create system' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description } = body as { id: string; name?: string; description?: string };
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data: system, error } = await supabase
      .from('systems')
      .update({ name, description })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating system:', error);
      return NextResponse.json({ error: 'Failed to update system' }, { status: 500 });
    }

    return NextResponse.json(system);
  } catch (error) {
    console.error('Error updating system:', error);
    return NextResponse.json({ error: 'Failed to update system' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
      .from('systems')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting system:', error);
      return NextResponse.json({ error: 'Failed to delete system' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system:', error);
    return NextResponse.json({ error: 'Failed to delete system' }, { status: 500 });
  }
}