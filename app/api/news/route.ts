import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const alpacaKey = process.env.ALPACA_API_KEY
    const alpacaSecret = process.env.ALPACA_API_SECRET

    if (!alpacaKey || !alpacaSecret) {
      return NextResponse.json(
        { error: 'Alpaca API keys not configured' },
        { status: 500 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener acciones favoritas del usuario
    const { data: favorites } = await supabase
      .from('favorite_stocks')
      .select('symbol')
      .eq('user_id', user.id)

    // Obtener portfolios del usuario y extraer símbolos únicos
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('stocks')
      .eq('user_id', user.id)

    // Combinar símbolos de favoritos y portfolios
    const favoriteSymbols = favorites?.map(f => f.symbol) || []
    const portfolioSymbols = portfolios
      ?.flatMap((p: any) => p.stocks?.map((s: any) => s.symbol) || []) || []
    
    // Unir y eliminar duplicados
    const allSymbols = [...new Set([...favoriteSymbols, ...portfolioSymbols])]

    // Si no hay símbolos, devolver noticias generales del mercado
    if (allSymbols.length === 0) {
      const response = await fetch(
        'https://data.alpaca.markets/v1beta1/news?limit=10',
        {
          headers: {
            'APCA-API-KEY-ID': alpacaKey,
            'APCA-API-SECRET-KEY': alpacaSecret,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Alpaca News API error: ${response.status}`)
      }

      const newsData = await response.json()
      return NextResponse.json({ news: newsData.news || [] })
    }

    // Obtener noticias para los símbolos del usuario
    const symbolsQuery = allSymbols.join(',')
    const response = await fetch(
      `https://data.alpaca.markets/v1beta1/news?symbols=${symbolsQuery}&limit=20&sort=desc`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Alpaca News API error: ${response.status}`)
    }

    const newsData = await response.json()

    // Transformar los datos al formato que espera el frontend
    const formattedNews = (newsData.news || []).map((article: any) => ({
      id: article.id,
      headline: article.headline,
      summary: article.summary || article.headline,
      author: article.author || article.source || 'Alpaca News',
      created_at: article.created_at,
      updated_at: article.updated_at,
      url: article.url,
      symbols: article.symbols || [],
      source: article.source
    }))

    return NextResponse.json({ 
      news: formattedNews,
      tracked_symbols: allSymbols
    })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { 
        error: 'Error fetching news',
        details: error?.message,
        news: [] // Devolver array vacío en caso de error
      },
      { status: 200 } // Devolver 200 para que el frontend pueda manejarlo
    )
  }
}
