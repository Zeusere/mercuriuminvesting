import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/users/check-username?u=nickname
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const u = (searchParams.get('u') || '').trim()

    if (!u) {
      return NextResponse.json({ ok: false, reason: 'empty' }, { status: 400 })
    }

    // basic constraints
    const username = u.toLowerCase()
    const valid = /^[a-z0-9_]{3,20}$/.test(username)
    if (!valid) {
      return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
    }

    const { count, error } = await supabase
      .from('user_profiles')
      .select('username', { count: 'exact', head: true })
      .ilike('username', username)

    if (error) {
      console.error('check-username error', error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true, available: (count || 0) === 0 })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


