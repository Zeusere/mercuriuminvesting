import { NextRequest, NextResponse } from 'next/server'
import { getAlpacaClient, hasAlpacaKey } from '@/lib/alpaca/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  try {
    if (!hasAlpacaKey()) {
      return NextResponse.json(
        { error: 'Alpaca API keys not configured. Please set ALPACA_API_KEY and ALPACA_API_SECRET in your .env.local file' },
        { status: 500 }
      )
    }

    if (!symbol || !from || !to) {
      return NextResponse.json(
        { error: 'Symbol, from, and to parameters are required' },
        { status: 400 }
      )
    }

    const client = getAlpacaClient()

    // Convertir timestamps unix a formato ISO
    const startDate = new Date(parseInt(from) * 1000).toISOString()
    const endDate = new Date(parseInt(to) * 1000).toISOString()

    // Obtener datos históricos de Alpaca usando el feed IEX (gratuito) y precios ajustados por splits
    const bars = await client.getBarsV2(symbol, {
      start: startDate,
      end: endDate,
      timeframe: '1Day', // Barras diarias
      limit: 10000,
      feed: 'iex', // Usar feed IEX para plan gratuito
      // Ajuste por splits para evitar distorsiones en gráficos y cálculos de performance
      // Ref: SPLIT_ADJUSTMENT_FIX.md
      adjustment: 'split' as any
    })

    // Convertir datos de Alpaca al formato que espera el frontend
    const timestamps: number[] = []
    const opens: number[] = []
    const highs: number[] = []
    const lows: number[] = []
    const closes: number[] = []
    const volumes: number[] = []

    for await (const bar of bars) {
      timestamps.push(Math.floor(new Date(bar.Timestamp).getTime() / 1000))
      opens.push(bar.OpenPrice)
      highs.push(bar.HighPrice)
      lows.push(bar.LowPrice)
      closes.push(bar.ClosePrice)
      volumes.push(bar.Volume)
    }

    if (timestamps.length === 0) {
      return NextResponse.json(
        { error: 'No data available for this symbol and period' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      c: closes,
      h: highs,
      l: lows,
      o: opens,
      t: timestamps,
      v: volumes,
      s: 'ok'
    })
  } catch (error: any) {
    console.error('Error fetching candles from Alpaca:', error)
    return NextResponse.json(
      { error: error?.message || 'Error fetching historical data' },
      { status: 500 }
    )
  }
}
