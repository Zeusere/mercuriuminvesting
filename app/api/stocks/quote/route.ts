import { NextRequest, NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    // Obtener el snapshot más reciente de Alpaca (incluye último trade y quote)
    const response = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status}`)
    }

    const snapshot = await response.json()

    // Transformar los datos al formato que espera el frontend (compatible con Finnhub)
    const currentPrice = snapshot.latestTrade?.p || snapshot.dailyBar?.c || snapshot.prevDailyBar?.c || 0
    const prevClose = snapshot.prevDailyBar?.c || 0
    
    const quote = {
      c: currentPrice, // current price
      d: prevClose ? currentPrice - prevClose : 0, // change from previous close
      dp: prevClose ? ((currentPrice - prevClose) / prevClose * 100) : 0, // percent change from previous close
      h: snapshot.dailyBar?.h || snapshot.prevDailyBar?.h || 0, // high
      l: snapshot.dailyBar?.l || snapshot.prevDailyBar?.l || 0, // low
      o: snapshot.dailyBar?.o || snapshot.prevDailyBar?.o || 0, // open
      pc: prevClose, // previous close
      t: snapshot.latestTrade?.t ? new Date(snapshot.latestTrade.t).getTime() / 1000 : Date.now() / 1000 // timestamp
    }

    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Error fetching quote', details: error?.message },
      { status: 500 }
    )
  }
}
