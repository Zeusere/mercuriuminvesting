import { NextRequest, NextResponse } from 'next/server'
import { getFinnhubClient, hasFinnhubKey } from '@/lib/finnhub/client'

export async function GET(request: NextRequest) {
  try {
    if (!hasFinnhubKey()) {
      return NextResponse.json(
        { error: 'Finnhub API key not configured' },
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

    const client = getFinnhubClient()
    
    try {
      const response = await client.companyBasicFinancials(symbol, 'all')
      return NextResponse.json(response.data)
    } catch (apiError: any) {
      // Si el endpoint no está disponible en el plan gratuito, devolver datos vacíos
      if (apiError?.response?.data?.error?.includes("don't have access")) {
        return NextResponse.json({
          metric: {},
          series: {},
          message: 'Métricas financieras no disponibles en el plan gratuito de Finnhub'
        })
      }
      throw apiError
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { 
        metric: {},
        series: {},
        error: 'Error fetching metrics' 
      },
      { status: 500 }
    )
  }
}
