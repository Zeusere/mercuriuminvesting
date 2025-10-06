import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { is_public } = await request.json()
    const portfolioId = params.id

    // Update portfolio public status
    const { data, error } = await supabase
      .from('portfolios')
      .update({ is_public })
      .eq('id', portfolioId)
      .eq('user_id', user.id) // Ensure user owns this portfolio
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Portfolio not found or you do not have permission' },
        { status: 404 }
      )
    }

    return NextResponse.json({ portfolio: data })
  } catch (error: any) {
    console.error('Error updating portfolio visibility:', error)
    return NextResponse.json(
      { error: 'Error updating portfolio visibility', details: error.message },
      { status: 500 }
    )
  }
}

