import Alpaca from '@alpacahq/alpaca-trade-api'

let alpacaClient: Alpaca | null = null

export function hasAlpacaKey(): boolean {
  return !!(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET)
}

export function getAlpacaClient(): Alpaca {
  if (!alpacaClient) {
    if (!hasAlpacaKey()) {
      throw new Error('Alpaca API keys not configured')
    }

    alpacaClient = new Alpaca({
      keyId: process.env.ALPACA_API_KEY!,
      secretKey: process.env.ALPACA_API_SECRET!,
      paper: true, // Usar paper trading (sin dinero real)
      usePolygon: false // Usar datos de Alpaca, no Polygon
    })
  }

  return alpacaClient
}
