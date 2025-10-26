import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Helper function to fetch stock info from Finnhub
async function getStockInfo(symbol: string) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.warn('Finnhub API key not configured');
      return null;
    }

    // Fetch profile
    const profileRes = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
    );
    const profile = await profileRes.json();

    // Fetch quote
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    const quote = await quoteRes.json();

    return {
      company_name: profile.name || null,
      logo_url: profile.logo || null,
      current_price: quote.c || null,
      price_change_pct: quote.dp || null,
    };
  } catch (error) {
    console.error('Error fetching stock info:', error);
    return null;
  }
}

// GET /api/stock-rooms/[symbol] - Get or create a stock room
export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const symbol = params.symbol.toUpperCase();

    // Get current user (optional for viewing)
    const { data: { user } } = await supabase.auth.getUser();

    // Check if room exists
    let { data: room, error: roomError } = await supabase
      .from('stock_rooms')
      .select('*')
      .eq('symbol', symbol)
      .single();

    // If room doesn't exist, create it
    if (roomError && roomError.code === 'PGRST116') {
      // Fetch stock info from Finnhub
      const stockInfo = await getStockInfo(symbol);

      const { data: newRoom, error: createError } = await supabase
        .from('stock_rooms')
        .insert({
          symbol,
          company_name: stockInfo?.company_name || symbol,
          logo_url: stockInfo?.logo_url,
          current_price: stockInfo?.current_price,
          price_change_pct: stockInfo?.price_change_pct,
          last_price_update: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating room:', createError);
        return NextResponse.json(
          { error: 'Failed to create room' },
          { status: 500 }
        );
      }

      room = newRoom;
    } else if (roomError) {
      console.error('Error fetching room:', roomError);
      return NextResponse.json(
        { error: 'Failed to fetch room' },
        { status: 500 }
      );
    }

    // If user is authenticated, check membership status
    let membership = null;
    if (user) {
      const { data: memberData } = await supabase
        .from('stock_room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      membership = memberData;
    }

    return NextResponse.json({
      room,
      is_member: !!membership,
      is_favorite: membership?.is_favorite || false,
      membership,
    });
  } catch (error) {
    console.error('Error in GET /api/stock-rooms/[symbol]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

