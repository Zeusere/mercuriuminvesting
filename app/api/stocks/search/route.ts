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
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const client = getFinnhubClient()
    const response = await client.symbolSearch(query)

    return NextResponse.json({
      results: response.data.result || [],
    })
  } catch (error) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Error searching stocks' },
      { status: 500 }
    )
  }
}
