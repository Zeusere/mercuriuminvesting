import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY

    if (!finnhubKey) {
      console.log('Finnhub API key not configured, falling back to Alpaca')
      return await getProfileFromAlpaca(symbol)
    }

    try {
      // Intentar obtener datos de Finnhub primero
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${finnhubKey}`
      )

      if (finnhubResponse.ok) {
        const finnhubData = await finnhubResponse.json()
        
        // Verificar que tenemos datos válidos de Finnhub
        if (finnhubData.name && finnhubData.name !== '') {
          return NextResponse.json({
            country: finnhubData.country || 'US',
            currency: finnhubData.currency || 'USD',
            exchange: finnhubData.exchange || 'NASDAQ',
            name: finnhubData.name,
            ticker: symbol,
            weburl: finnhubData.weburl || '',
            logo: finnhubData.logo || '',
            finnhubIndustry: finnhubData.finnhubIndustry || 'Technology',
            marketCapitalization: finnhubData.marketCapitalization || 0,
            shareOutstanding: finnhubData.shareOutstanding || 0,
            ipo: finnhubData.ipo || '',
            phone: finnhubData.phone || '',
            address: finnhubData.address || ''
          })
        }
      }
    } catch (finnhubError) {
      console.log('Finnhub API error, falling back to Alpaca:', finnhubError)
    }

    // Fallback a Alpaca si Finnhub falla
    return await getProfileFromAlpaca(symbol)

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
        finnhubIndustry: 'Technology',
        error: 'Error fetching profile',
        details: error?.message
      },
      { status: 200 }
    )
  }
}

async function getProfileFromAlpaca(symbol: string | null) {
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

  try {
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

    // Mapear industrias comunes basadas en el símbolo o nombre
    const getIndustryFromSymbol = (symbol: string, name: string) => {
      const symbolLower = symbol.toLowerCase()
      const nameLower = name.toLowerCase()
      
      if (symbolLower.includes('aapl') || nameLower.includes('apple')) return 'Technology'
      if (symbolLower.includes('msft') || nameLower.includes('microsoft')) return 'Technology'
      if (symbolLower.includes('googl') || nameLower.includes('google')) return 'Technology'
      if (symbolLower.includes('amzn') || nameLower.includes('amazon')) return 'Consumer Discretionary'
      if (symbolLower.includes('tsla') || nameLower.includes('tesla')) return 'Automotive'
      if (symbolLower.includes('nvda') || nameLower.includes('nvidia')) return 'Technology'
      if (symbolLower.includes('meta') || nameLower.includes('facebook')) return 'Technology'
      if (symbolLower.includes('jpm') || nameLower.includes('jpmorgan')) return 'Financial Services'
      if (symbolLower.includes('jnj') || nameLower.includes('johnson')) return 'Healthcare'
      if (symbolLower.includes('pg') || nameLower.includes('procter')) return 'Consumer Staples'
      
      // Detectar por palabras clave
      if (nameLower.includes('bank') || nameLower.includes('financial')) return 'Financial Services'
      if (nameLower.includes('tech') || nameLower.includes('software')) return 'Technology'
      if (nameLower.includes('pharma') || nameLower.includes('medical')) return 'Healthcare'
      if (nameLower.includes('energy') || nameLower.includes('oil')) return 'Energy'
      if (nameLower.includes('retail') || nameLower.includes('store')) return 'Consumer Discretionary'
      
      return 'Technology' // Default para la mayoría de acciones populares
    }

    const industry = getIndustryFromSymbol(symbol, asset.name || symbol)

    // Transformar al formato que espera el frontend (compatible con Finnhub)
    return NextResponse.json({
      country: 'US',
      currency: 'USD',
      exchange: asset.exchange || 'NASDAQ',
      name: asset.name || symbol,
      ticker: symbol,
      weburl: '',
      logo: '',
      finnhubIndustry: industry,
      marketCapitalization: 0,
      shareOutstanding: 0
    })
  } catch (error: any) {
    console.error('Error fetching profile from Alpaca:', error)
    return NextResponse.json(
      { 
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ',
        name: symbol || 'Unknown',
        ticker: symbol || 'Unknown',
        weburl: '',
        logo: '',
        finnhubIndustry: 'Technology',
        error: 'Error fetching profile',
        details: error?.message
      },
      { status: 200 }
    )
  }
}
