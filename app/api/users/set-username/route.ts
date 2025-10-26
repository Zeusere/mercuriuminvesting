import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/users/set-username { username }
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const raw = (body?.username || '').trim().toLowerCase()
  if (!/^([a-z0-9_]{3,20})$/.test(raw)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  // Ensure uniqueness
  const { count } = await supabase
    .from('user_profiles')
    .select('username', { count: 'exact', head: true })
    .ilike('username', raw)

  if ((count || 0) > 0) {
    return NextResponse.json({ error: 'Username taken' }, { status: 409 })
  }

  // Update profile
  const { error: upErr } = await supabase
    .from('user_profiles')
    .update({ username: raw })
    .eq('user_id', user.id)

  if (upErr) {
    return NextResponse.json({ error: 'Failed to set username' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, username: raw })
}


