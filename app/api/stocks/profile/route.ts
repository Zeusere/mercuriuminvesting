import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  
  try {
    const alpacaKey = process.env.ALPACA_API_KEY
    const alpacaSecret = process.env.ALPACA_API_SECRET

    if (!alpacaKey || !alpacaSecret) {
      return NextResponse.json(
        { error: 'Alpaca API keys not configured' },
        { status: 500 }
      )
    }

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    // Obtener información del asset de Alpaca
    const response = await fetch(
      `https://paper-api.alpaca.markets/v2/assets/${symbol}`,
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

    const asset = await response.json()

    // Transformar al formato que espera el frontend (compatible con Finnhub)
    return NextResponse.json({
      country: 'US',
      currency: 'USD',
      exchange: asset.exchange || 'NASDAQ',
      name: asset.name || symbol,
      ticker: symbol,
      weburl: '',
      logo: '',
      finnhubIndustry: 'N/A',
      marketCapitalization: 0,
      shareOutstanding: 0
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { 
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ',
        name: symbol || 'Unknown',
        ticker: symbol || 'Unknown',
        weburl: '',
        logo: '',
        finnhubIndustry: 'N/A',
        error: 'Error fetching profile',
        details: error?.message
      },
      { status: 200 } // Devolver 200 con datos básicos
    )
  }
}
