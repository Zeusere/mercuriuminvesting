import { DefaultApi } from 'finnhub-ts'

let finnhubClient: DefaultApi | null = null

export function getFinnhubClient(): DefaultApi {
  if (!finnhubClient) {
    const apiKey = process.env.FINNHUB_API_KEY || ''
    finnhubClient = new DefaultApi({
      apiKey,
      isJsonMime: (mime: string) => {
        return mime === 'application/json'
      },
    })
  }
  return finnhubClient
}

export function hasFinnhubKey(): boolean {
  return !!process.env.FINNHUB_API_KEY
}
