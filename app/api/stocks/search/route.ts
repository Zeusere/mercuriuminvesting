import { NextRequest, NextResponse } from 'next/server'

interface ScoredAsset {
  symbol: string
  description: string
  displaySymbol: string
  type: string
  score: number
}

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
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Usar el endpoint de assets de Alpaca para buscar acciones
    const response = await fetch(
      `https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity`,
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

    const assets = await response.json()

    // Filtrar y ordenar los resultados por relevancia
    const queryLower = query.toLowerCase()
    const filteredAssets = assets
      .filter((asset: any) => {
        const symbolMatch = asset.symbol.toLowerCase().includes(queryLower)
        const nameMatch = asset.name?.toLowerCase().includes(queryLower)
        return (symbolMatch || nameMatch) && asset.tradable && asset.status === 'active'
      })
      .map((asset: any) => {
        const symbolLower = asset.symbol.toLowerCase()
        const nameLower = asset.name?.toLowerCase() || ''
        
        // Sistema de scoring de relevancia
        let score = 0
        
        // Coincidencia exacta del símbolo (máxima prioridad)
        if (symbolLower === queryLower) {
          score = 1000
        }
        // El símbolo empieza con la búsqueda
        else if (symbolLower.startsWith(queryLower)) {
          score = 900
        }
        // El símbolo contiene la búsqueda
        else if (symbolLower.includes(queryLower)) {
          score = 800
        }
        // El nombre empieza con la búsqueda
        else if (nameLower.startsWith(queryLower)) {
          score = 700
        }
        // El nombre contiene la búsqueda como palabra completa
        else if (nameLower.split(' ').some((word: string) => word.startsWith(queryLower))) {
          score = 600
        }
        // El nombre contiene la búsqueda
        else if (nameLower.includes(queryLower)) {
          score = 500
        }
        
        // Bonus por símbolos más cortos (generalmente más populares)
        if (asset.symbol.length <= 4) {
          score += 50
        }
        
        return {
          symbol: asset.symbol,
          description: asset.name || asset.symbol,
          displaySymbol: asset.symbol,
          type: 'Common Stock',
          score
        } as ScoredAsset
      })
      .sort((a: ScoredAsset, b: ScoredAsset) => b.score - a.score) // Ordenar por relevancia
      .slice(0, 20) // Limitar a 20 resultados
      .map(({ symbol, description, displaySymbol, type }: ScoredAsset) => ({
        symbol,
        description,
        displaySymbol,
        type
      }))

    return NextResponse.json({
      results: filteredAssets,
    })
  } catch (error: any) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Error searching stocks', details: error?.message },
      { status: 500 }
    )
  }
}
