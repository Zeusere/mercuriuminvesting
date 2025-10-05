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
    const response = await client.quote(symbol)

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Error fetching quote' },
      { status: 500 }
    )
  }
}
