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

    // Get snapshot for current price and today's data
    const snapshotResponse = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    if (!snapshotResponse.ok) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      )
    }

    const snapshot = await snapshotResponse.json()

    // Get 3-month historical data
    // Using split-adjusted prices to avoid distortion from stock splits
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 3)

    const barsResponse = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/bars?` +
      `start=${startDate.toISOString()}&` +
      `end=${endDate.toISOString()}&` +
      `timeframe=1Day&` +
      `limit=100&` +
      `feed=iex&` +
      `adjustment=split`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    const barsData = await barsResponse.json()
    const bars = barsData.bars || []

    let performance_3m = 0
    let volatility = 0

    if (bars.length >= 2) {
      const firstPrice = bars[0].c
      const lastPrice = bars[bars.length - 1].c
      performance_3m = ((lastPrice - firstPrice) / firstPrice) * 100

      // Calculate volatility
      const returns = []
      for (let i = 1; i < bars.length; i++) {
        const dailyReturn = ((bars[i].c - bars[i - 1].c) / bars[i - 1].c) * 100
        returns.push(dailyReturn)
      }
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      volatility = Math.sqrt(variance)
    }

    const currentPrice = snapshot.latestTrade?.p || snapshot.dailyBar?.c || 0
    const dailyBar = snapshot.dailyBar || {}
    const prevDailyBar = snapshot.prevDailyBar || {}

    const performance_1d = prevDailyBar.c
      ? ((currentPrice - prevDailyBar.c) / prevDailyBar.c) * 100
      : 0

    // Get company info from Alpaca
    const assetResponse = await fetch(
      `https://paper-api.alpaca.markets/v2/assets/${symbol}`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    let companyName = symbol
    if (assetResponse.ok) {
      const asset = await assetResponse.json()
      companyName = asset.name || symbol
    }

    return NextResponse.json({
      symbol,
      name: companyName,
      price: currentPrice,
      performance_1d,
      performance_3m,
      volatility,
      volume: dailyBar.v || 0,
      high: dailyBar.h || 0,
      low: dailyBar.l || 0,
      open: dailyBar.o || 0,
      close: currentPrice,
      prev_close: prevDailyBar.c || 0
    })

  } catch (error: any) {
    console.error('Error fetching stock info:', error)
    return NextResponse.json(
      { error: 'Error fetching stock information', details: error?.message },
      { status: 500 }
    )
  }
}
