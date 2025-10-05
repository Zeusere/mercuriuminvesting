export interface StockQuote {
  c: number  // Current price
  d: number  // Change
  dp: number // Percent change
  h: number  // High price of the day
  l: number  // Low price of the day
  o: number  // Open price of the day
  pc: number // Previous close price
  t: number  // Timestamp
}

export interface StockProfile {
  country: string
  currency: string
  exchange: string
  ipo: string
  marketCapitalization: number
  name: string
  phone: string
  shareOutstanding: number
  ticker: string
  weburl: string
  logo: string
  finnhubIndustry: string
}

export interface StockCandle {
  c: number[]  // Close prices
  h: number[]  // High prices
  l: number[]  // Low prices
  o: number[]  // Open prices
  t: number[]  // Timestamps
  v: number[]  // Volumes
  s: string    // Status
}

export interface StockMetrics {
  '10DayAverageTradingVolume': number
  '52WeekHigh': number
  '52WeekLow': number
  '52WeekHighDate': string
  '52WeekLowDate': string
  beta: number
  marketCapitalization: number
  peRatio: number
  dividendYield: number
}

export interface SearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export interface PortfolioStock {
  symbol: string
  name: string
  weight: number  // Percentage (0-100)
  amount?: number // Amount in currency
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  stocks: PortfolioStock[]
  total_amount: number
  created_at: string
  updated_at: string
}

export interface PortfolioPerformance {
  portfolio_id: string
  dates: string[]
  values: number[]
  returns: number[]
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
}

export interface StockPerformance {
  symbol: string
  name: string
  weight: number
  initial_price: number
  final_price: number
  return_percent: number
  contribution_to_portfolio: number
}

export interface BacktestResult {
  initial_value: number
  final_value: number
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  period_label: string
  historical_values: Array<{
    date: string
    value: number
    return: number
  }>
  stock_performance: StockPerformance[]
}

export interface MultiPeriodBacktest {
  '1M': BacktestResult
  '3M': BacktestResult
  'YTD': BacktestResult
  '1Y': BacktestResult
  '3Y': BacktestResult
  '5Y': BacktestResult
}
