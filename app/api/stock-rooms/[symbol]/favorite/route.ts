import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/stock-rooms/[symbol]/favorite - Toggle favorite status
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

    // Check if member exists
    const { data: membership } = await supabase
      .from('stock_room_members')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Must join room before favoriting' },
        { status: 400 }
      );
    }

    // Toggle favorite
    const newFavoriteStatus = !membership.is_favorite;

    const { data: updatedMembership, error: updateError } = await supabase
      .from('stock_room_members')
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', membership.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating favorite status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update favorite status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites',
      is_favorite: newFavoriteStatus,
      membership: updatedMembership,
    });
  } catch (error) {
    console.error('Error in POST /api/stock-rooms/[symbol]/favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

