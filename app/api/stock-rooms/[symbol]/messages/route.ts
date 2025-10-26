import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/stock-rooms/[symbol]/messages - Get messages with pagination
export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const symbol = params.symbol.toUpperCase();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const beforeId = searchParams.get('before_id'); // For loading older messages
    const afterId = searchParams.get('after_id'); // For loading newer messages

    // Get current user (optional for viewing)
    const { data: { user } } = await supabase.auth.getUser();

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

    // Build query for messages
    let query = supabase
      .from('stock_room_messages')
      .select('*')
      .eq('room_id', room.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor-based pagination
    if (beforeId) {
      // Get messages before this ID (older messages)
      const { data: beforeMessage } = await supabase
        .from('stock_room_messages')
        .select('created_at')
        .eq('id', beforeId)
        .single();

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at);
      }
    } else if (afterId) {
      // Get messages after this ID (newer messages)
      const { data: afterMessage } = await supabase
        .from('stock_room_messages')
        .select('created_at')
        .eq('id', afterId)
        .single();

      if (afterMessage) {
        query = query.gt('created_at', afterMessage.created_at);
      }
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const returnMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to show oldest first (chat convention)
    returnMessages.reverse();

    // If user is authenticated, check which messages they've liked
    let likedMessageIds: string[] = [];
    if (user && returnMessages.length > 0) {
      const messageIds = returnMessages.map((m) => m.id);
      const { data: likes } = await supabase
        .from('stock_room_message_likes')
        .select('message_id')
        .eq('user_id', user.id)
        .in('message_id', messageIds);

      likedMessageIds = likes?.map((l) => l.message_id) || [];
    }

    // Fetch user profiles for messages
    const uniqueUserIds = Array.from(new Set(returnMessages.map((m: any) => m.user_id))).filter(Boolean);
    let userMap: Record<string, { username: string | null; display_name: string | null; avatar_url: string | null }> = {};
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', uniqueUserIds as string[]);

      (profiles || []).forEach((p: any) => {
        userMap[p.user_id] = { username: p.username || null, display_name: p.display_name || null, avatar_url: p.avatar_url || null };
      });
    }

    // Format messages with user data and like status
    const formattedMessages = returnMessages.map((msg: any) => {
      const profile = userMap[msg.user_id] || null;
      const nameFallback = profile?.display_name || profile?.username || null;
      return {
        ...msg,
        user: {
          id: msg.user_id,
          username: profile?.username || null,
          display_name: nameFallback || 'Anonymous',
          avatar_url: profile?.avatar_url || null,
        },
        is_liked_by_me: likedMessageIds.includes(msg.id),
      };
    });

    return NextResponse.json({
      messages: formattedMessages,
      has_more: hasMore,
      next_cursor: hasMore ? returnMessages[returnMessages.length - 1]?.id : null,
    });
  } catch (error) {
    console.error('Error in GET /api/stock-rooms/[symbol]/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/stock-rooms/[symbol]/messages - Send a message
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
    const { content, message_type = 'text' } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Get or create room
    let { data: room } = await supabase
      .from('stock_rooms')
      .select('id')
      .eq('symbol', symbol)
      .single();

    // If room doesn't exist, this is the first message - create the room
    if (!room) {
      // Fetch basic stock info (we could make this more robust)
      const { data: newRoom, error: createError } = await supabase
        .from('stock_rooms')
        .insert({
          symbol,
          company_name: symbol, // Will be updated by price update service
        })
        .select()
        .single();

      if (createError || !newRoom) {
        console.error('Error creating room:', createError);
        return NextResponse.json(
          { error: 'Failed to create room' },
          { status: 500 }
        );
      }

      room = newRoom;
    }

    // Type guard to ensure room is not null
    if (!room) {
      return NextResponse.json(
        { error: 'Failed to get room' },
        { status: 500 }
      );
    }

    // Auto-join the user who created/accessed the room (if not already a member)

    // Check if user is a member, if not auto-join them
    const { data: membership } = await supabase
      .from('stock_room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      // Auto-join user
      await supabase
        .from('stock_room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('stock_room_messages')
      .insert({
        room_id: room.id,
        user_id: user.id,
        content: content.trim(),
        message_type,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Fetch user info to return with message
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    const formattedMessage = {
      ...message,
      user: {
        id: user.id,
        username: userProfile?.username || null,
        display_name: userProfile?.display_name || user.email?.split('@')[0] || 'Anonymous',
        avatar_url: userProfile?.avatar_url || null,
      },
      is_liked_by_me: false,
    };

    return NextResponse.json({
      message: formattedMessage,
    });
  } catch (error) {
    console.error('Error in POST /api/stock-rooms/[symbol]/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

