import { NextRequest, NextResponse } from 'next/server'
import { getFinnhubClient, hasFinnhubKey } from '@/lib/finnhub/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  
  try {
    if (!hasFinnhubKey()) {
      return NextResponse.json(
        { error: 'Finnhub API key not configured' },
        { status: 500 }
      )
    }

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const client = getFinnhubClient()
    
    try {
      const response = await client.companyProfile2(symbol)
      return NextResponse.json(response.data)
    } catch (apiError: any) {
      // Si el endpoint no está disponible, devolver datos básicos
      if (apiError?.response?.data?.error?.includes("don't have access")) {
        return NextResponse.json({
          country: 'US',
          currency: 'USD',
          exchange: 'NASDAQ',
          name: symbol,
          ticker: symbol,
          weburl: '',
          logo: '',
          finnhubIndustry: 'Technology',
          message: 'Perfil completo no disponible en el plan gratuito de Finnhub'
        })
      }
      throw apiError
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { 
        country: 'US',
        currency: 'USD',
        name: symbol || 'Unknown',
        ticker: symbol || 'Unknown',
        error: 'Error fetching profile' 
      },
      { status: 500 }
    )
  }
}
