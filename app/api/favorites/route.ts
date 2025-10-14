import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET - Obtener favoritos del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('favorite_stocks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ favorites: data || [] })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Error fetching favorites' },
      { status: 500 }
    )
  }
}

// POST - Añadir favorito
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol, name } = await request.json()

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('favorite_stocks')
      .insert([
        {
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          name: name || symbol,
        },
      ])
      .select()
      .single()

    if (error) {
      // Si es un error de duplicado, devolver información más amigable
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Stock already in favorites' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ favorite: data }, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Error adding favorite' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar favorito
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('favorite_stocks')
      .delete()
      .eq('symbol', symbol.toUpperCase())
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json(
      { error: 'Error deleting favorite' },
      { status: 500 }
    )
  }
}
