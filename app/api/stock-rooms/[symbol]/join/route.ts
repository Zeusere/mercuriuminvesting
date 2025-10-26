import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/stock-rooms/[symbol]/join - Join a stock room
export async function POST(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const symbol = params.symbol.toUpperCase();

    // Auth required
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notifications_enabled = true } = body;

    // Get or create room
    let { data: room } = await supabase
      .from('stock_rooms')
      .select('id')
      .eq('symbol', symbol)
      .single();

    if (!room) {
      // Room doesn't exist - this shouldn't happen if called after GET
      // but we handle it anyway
      return NextResponse.json(
        { error: 'Room not found. Please try again.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('stock_room_members')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      // Already a member - just return the membership
      return NextResponse.json({
        message: 'Already a member',
        membership: existingMember,
      });
    }

    // Create membership
    const { data: membership, error: memberError } = await supabase
      .from('stock_room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        notifications_enabled,
        is_favorite: false,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating membership:', memberError);
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully joined room',
      membership,
    });
  } catch (error) {
    console.error('Error in POST /api/stock-rooms/[symbol]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-rooms/[symbol]/join - Leave a stock room
export async function DELETE(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const symbol = params.symbol.toUpperCase();

    // Auth required
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get room
    const { data: room } = await supabase
      .from('stock_rooms')
      .select('id')
      .eq('symbol', symbol)
      .single();

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Delete membership
    const { error: deleteError } = await supabase
      .from('stock_room_members')
      .delete()
      .eq('room_id', room.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error leaving room:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave room' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully left room',
    });
  } catch (error) {
    console.error('Error in DELETE /api/stock-rooms/[symbol]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

