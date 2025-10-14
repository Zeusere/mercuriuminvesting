import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const finnhubKey = process.env.FINNHUB_API_KEY

    if (!finnhubKey) {
      return NextResponse.json({ metric: {}, series: {}, message: 'Finnhub API key not configured' })
    }

    try {
      // Obtener métricas fundamentales reales de Finnhub
      const [metricsResponse, quoteResponse] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&token=${finnhubKey}`),
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`)
      ])

      if (metricsResponse.ok && quoteResponse.ok) {
        const metricsData = await metricsResponse.json()
        await quoteResponse.json() // not used right now, but keep fetch paired for rate limits

        // Construir solo con campos presentes (evita ceros artificiales)
        const m: any = metricsData?.metric || {}
        const metric: Record<string, number> = {}
        if (typeof m.marketCapitalization === 'number') metric.marketCapitalization = m.marketCapitalization
        if (typeof m.peBasicExclExtraTTM === 'number') metric.peRatio = m.peBasicExclExtraTTM
        if (typeof m.beta === 'number') metric.beta = m.beta
        if (typeof m.fiftyTwoWeekHigh === 'number') metric['52WeekHigh'] = m.fiftyTwoWeekHigh
        if (typeof m.fiftyTwoWeekLow === 'number') metric['52WeekLow'] = m.fiftyTwoWeekLow
        if (typeof m.dividendYield === 'number') metric.dividendYield = m.dividendYield
        if (typeof m.epsBasicExclExtraAnnual === 'number') metric.eps = m.epsBasicExclExtraAnnual
        if (typeof m.revenueGrowthAnnual === 'number') metric.revenueGrowth = m.revenueGrowthAnnual
        if (typeof m.profitMarginAnnual === 'number') metric.profitMargin = m.profitMarginAnnual
        if (typeof m.roeAnnual === 'number') metric.returnOnEquity = m.roeAnnual
        if (typeof m.debtToEquityAnnual === 'number') metric.debtToEquity = m.debtToEquityAnnual
        if (typeof m.currentRatioAnnual === 'number') metric.currentRatio = m.currentRatioAnnual
        if (typeof m.pbQuarterly === 'number') metric.priceToBook = m.pbQuarterly
        if (typeof m.psTTM === 'number') metric.priceToSales = m.psTTM
        if (typeof m.evToEbitdaTTM === 'number') metric.evToEbitda = m.evToEbitdaTTM

        return NextResponse.json({ metric, series: metricsData.series || {}, message: 'Finnhub' })
      } else {
        return NextResponse.json({ metric: {}, series: {}, message: 'Finnhub API unavailable' })
      }
    } catch (finnhubError) {
      console.log('Finnhub API error:', finnhubError)
      return NextResponse.json({ metric: {}, series: {}, message: 'Finnhub API error' })
    }
  } catch (error: any) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { 
        metric: {},
        series: {},
        error: 'Error fetching metrics',
        details: error?.message
      },
      { status: 200 }
    )
  }
}
