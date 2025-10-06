import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portfolioId = params.id

    // Fetch portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single()

    if (error) {
      console.error('Error fetching portfolio:', error)
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Check if user can view this portfolio (owner or public)
    if (portfolio.user_id !== user.id && !portfolio.is_public) {
      return NextResponse.json({ error: 'This portfolio is private' }, { status: 403 })
    }

    return NextResponse.json(portfolio)
  } catch (error: any) {
    console.error('Unexpected error in GET /api/portfolios/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

