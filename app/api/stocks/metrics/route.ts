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

    // Alpaca no proporciona métricas financieras detalladas
    // Devolver estructura vacía compatible con el frontend
    return NextResponse.json({
      metric: {
        // Métricas básicas vacías
      },
      series: {},
      message: 'Detailed financial metrics not available through Alpaca API. Price data is available in the chart.'
    })
  } catch (error: any) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { 
        metric: {},
        series: {},
        error: 'Error fetching metrics',
        details: error?.message
      },
      { status: 200 } // Devolver 200 con datos vacíos
    )
  }
}
