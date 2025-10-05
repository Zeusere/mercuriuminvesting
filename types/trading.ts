export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT'
export type OrderSide = 'BUY' | 'SELL'
export type OrderStatus = 'PENDING' | 'ACTIVE' | 'FILLED' | 'CANCELLED' | 'REJECTED'

export interface StopLoss {
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  price?: number
}

export interface TakeProfit {
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  price?: number
}

export interface TradingOrder {
  id: string
  user_id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity?: number
  amount?: number // Amount in currency
  price?: number
  stop_loss?: StopLoss
  take_profit?: TakeProfit
  status: OrderStatus
  raw_input: string
  parsed_intent: string
  broker_order_id?: string
  created_at: string
  updated_at: string
  executed_at?: string
  execution_price?: number
}

export interface OrderParseResult {
  success: boolean
  order?: Partial<TradingOrder>
  error?: string
  confidence: number
  interpretation: string
}

export interface BrokerConfig {
  id: string
  user_id: string
  broker_name: string
  api_key: string
  api_secret: string
  is_active: boolean
  is_sandbox: boolean
  created_at: string
}

