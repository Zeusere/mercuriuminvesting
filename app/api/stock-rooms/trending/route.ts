import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/stock-rooms/trending - Get trending stock rooms
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get trending rooms
    // Sorted by: active_members_24h (primary), total_messages (secondary), last_message_at (tertiary)
    const { data: rooms, error: roomsError } = await supabase
      .from('stock_rooms')
      .select('*')
      .order('active_members_24h', { ascending: false })
      .order('total_messages', { ascending: false })
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (roomsError) {
      console.error('Error fetching trending rooms:', roomsError);
      return NextResponse.json(
        { error: 'Failed to fetch trending rooms' },
        { status: 500 }
      );
    }

    // Filter out rooms with no activity
    const activeRooms = rooms.filter((room) => room.total_messages > 0);

    return NextResponse.json({
      rooms: activeRooms,
    });
  } catch (error) {
    console.error('Error in GET /api/stock-rooms/trending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

