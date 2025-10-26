import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/community/trending-stocks - top 5 symbols used across public portfolios
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch public portfolios with stocks JSON
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('stocks')
      .eq('is_public', true)

    if (error) {
      console.error('Trending stocks error:', error)
      return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }

    const counts: Record<string, number> = {}
    ;(portfolios || []).forEach((p: any) => {
      try {
        const stocks = Array.isArray(p.stocks) ? p.stocks : []
        const uniqueSymbols = Array.from(new Set(stocks.map((s: any) => s?.symbol).filter((v: any) => typeof v === 'string')))
        uniqueSymbols.forEach((sym: any) => {
          counts[sym] = (counts[sym] || 0) + 1
        })
      } catch {}
    })

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, portfoliosCount]) => ({ symbol, portfoliosCount }))

    return NextResponse.json({ symbols: top })
  } catch (e) {
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}


