// Types for AI Investor functionality

export type AIMode = 'create-portfolio' | 'analyze' | 'broker-orders'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    stocks?: StockRecommendation[]
    analysis?: PortfolioAnalysis
    order?: any
  }
}

export interface StockRecommendation {
  symbol: string
  name: string
  weight: number
  reason: string
  metrics: {
    performance_1y?: number
    performance_ytd?: number
    performance_3m?: number
    volatility?: number
    market_cap?: number
    price?: number
    volume?: number
  }
}

export interface PortfolioSuggestion {
  stocks: StockRecommendation[]
  summary: string
  risk_assessment: string
  total_amount: number
  expected_return?: string
  diversification_score?: number
}

export interface PortfolioAnalysis {
  portfolio_id: string
  portfolio_name: string
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: AnalysisRecommendation[]
  overall_score: number
  risk_level: string
  diversification_score: number
}

export interface AnalysisRecommendation {
  action: 'increase' | 'decrease' | 'hold' | 'remove' | 'add'
  symbol: string
  current_weight?: number
  suggested_weight?: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface AIRequest {
  mode: AIMode
  prompt: string
  context: ChatMessage[]
  portfolio_id?: string
  total_amount?: number
}
