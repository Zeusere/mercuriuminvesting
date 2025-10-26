import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/stock-rooms/[symbol]/read - mark room as read (set last_read_message_id to latest)
export async function POST(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const symbol = params.symbol.toUpperCase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get room
    const { data: room } = await supabase
      .from('stock_rooms')
      .select('id')
      .eq('symbol', symbol)
      .single()

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    // Get most recent message id
    const { data: lastMsg } = await supabase
      .from('stock_room_messages')
      .select('id, created_at')
      .eq('room_id', room.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Ensure membership exists
    const { data: membership } = await supabase
      .from('stock_room_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 400 })

    const { error: updErr } = await supabase
      .from('stock_room_members')
      .update({ last_read_message_id: lastMsg?.id || null, last_seen_at: new Date().toISOString() })
      .eq('id', membership.id)

    if (updErr) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

    return NextResponse.json({ ok: true, last_read_message_id: lastMsg?.id || null })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


