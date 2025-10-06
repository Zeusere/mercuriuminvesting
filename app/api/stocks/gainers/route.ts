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

    // Usar el endpoint de screener de Alpaca para obtener gainers y losers
    // Este endpoint devuelve las acciones que más suben/bajan del mercado
    const response = await fetch(
      'https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=5',
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

    const data = await response.json()
    
    // El endpoint devuelve { gainers: [...], losers: [...] }
    const gainers = data.gainers || []
    const losers = data.losers || []

    // Transformar los datos al formato que espera el frontend
    const formattedGainers = gainers.slice(0, 5).map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.symbol,
      price: stock.price || 0,
      change: stock.change || 0,
      changePercent: stock.percent_change || 0,
      volume: stock.volume || 0
    }))

    const formattedLosers = losers.slice(0, 5).map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.symbol,
      price: stock.price || 0,
      change: stock.change || 0,
      changePercent: stock.percent_change || 0,
      volume: stock.volume || 0
    }))

    return NextResponse.json({
      gainers: formattedGainers,
      losers: formattedLosers,
      marketOpen: isMarketOpen()
    })
  } catch (error: any) {
    console.error('Error fetching gainers:', error)
    
    // Si falla, intentar con un método alternativo usando snapshots
    try {
      return await getFallbackGainers()
    } catch (fallbackError: any) {
      console.error('Fallback also failed:', fallbackError)
      return NextResponse.json(
        { 
          error: 'Error fetching market gainers',
          details: error?.message || 'Unknown error',
          gainers: [], // Devolver array vacío en lugar de error
          losers: []
        },
        { status: 200 } // Devolver 200 para que el frontend pueda manejarlo
      )
    }
  }
}

// Método alternativo usando lista de acciones populares
async function getFallbackGainers() {
  const alpacaKey = process.env.ALPACA_API_KEY
  const alpacaSecret = process.env.ALPACA_API_SECRET

  // Lista de acciones líquidas y populares
  const popularStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
    'AMD', 'INTC', 'SPY', 'QQQ', 'DIS', 'BA', 'JPM', 'V',
    'MA', 'WMT', 'HD', 'BAC', 'XOM', 'CVX', 'PG', 'KO',
    'PEP', 'ORCL', 'CRM', 'ADBE', 'CSCO', 'NKE', 'COST', 'MCD'
  ]

  const response = await fetch(
    `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${popularStocks.join(',')}`,
    {
      headers: {
        'APCA-API-KEY-ID': alpacaKey!,
        'APCA-API-SECRET-KEY': alpacaSecret!,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Alpaca snapshots API error: ${response.status}`)
  }

  const snapshots = await response.json()

  // Procesar snapshots y calcular cambios
  const stocksArray = Object.entries(snapshots).map(([symbol, data]: [string, any]) => {
    try {
      const dailyBar = data.dailyBar || data.prevDailyBar
      const latestTrade = data.latestTrade
      
      if (!dailyBar) {
        return null
      }

      const openPrice = dailyBar.o
      const currentPrice = latestTrade?.p || dailyBar.c
      const changePercent = ((currentPrice - openPrice) / openPrice) * 100
      const changeAmount = currentPrice - openPrice

      return {
        symbol,
        name: symbol,
        price: currentPrice,
        change: changeAmount,
        changePercent: changePercent,
        volume: dailyBar.v
      }
    } catch (err) {
      return null
    }
  }).filter((stock): stock is NonNullable<typeof stock> => stock !== null)

  // Separar gainers y losers
  const topGainers = stocksArray
    .filter(stock => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)

  const topLosers = stocksArray
    .filter(stock => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)

  return NextResponse.json({
    gainers: topGainers,
    losers: topLosers,
    marketOpen: isMarketOpen()
  })
}

function isMarketOpen(): boolean {
  const now = new Date()
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = ny.getDay()
  const hour = ny.getHours()
  const minute = ny.getMinutes()

  // Mercado abierto: Lunes-Viernes, 9:30 AM - 4:00 PM ET
  if (day === 0 || day === 6) return false // Fin de semana
  if (hour < 9 || hour >= 16) return false
  if (hour === 9 && minute < 30) return false

  return true
}
