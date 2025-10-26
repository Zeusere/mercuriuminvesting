import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/stock-rooms/my-favorites - Get user's favorite stock rooms
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    // Auth required
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's favorite memberships with room data
    const { data: memberships, error: membershipsError } = await supabase
      .from('stock_room_members')
      .select(`
        *,
        room:room_id (
          id,
          symbol,
          company_name,
          logo_url,
          current_price,
          price_change_pct,
          total_messages,
          total_members,
          last_message_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('last_seen_at', { ascending: false });

    if (membershipsError) {
      console.error('Error fetching favorite rooms:', membershipsError);
      return NextResponse.json(
        { error: 'Failed to fetch favorite rooms' },
        { status: 500 }
      );
    }

    // Calculate unread count for each room
    const roomsWithUnread = await Promise.all(
      memberships.map(async (membership) => {
        let unreadCount = 0;

        // If user has a last_read_message_id, count newer messages
        if (membership.last_read_message_id) {
          const { data: lastReadMessage } = await supabase
            .from('stock_room_messages')
            .select('created_at')
            .eq('id', membership.last_read_message_id)
            .single();

          if (lastReadMessage) {
            const { count } = await supabase
              .from('stock_room_messages')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', membership.room_id)
              .gt('created_at', lastReadMessage.created_at)
              .is('deleted_at', null);

            unreadCount = count || 0;
          }
        } else {
          // No last read message - all messages are unread
          const { count } = await supabase
            .from('stock_room_messages')
            .select('id', { count: 'exact', head: true })
            .eq('room_id', membership.room_id)
            .is('deleted_at', null);

          unreadCount = count || 0;
        }

        return {
          ...membership,
          room: Array.isArray(membership.room) ? membership.room[0] : membership.room,
          unread_count: unreadCount,
        };
      })
    );

    return NextResponse.json({
      favorites: roomsWithUnread,
    });
  } catch (error) {
    console.error('Error in GET /api/stock-rooms/my-favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

