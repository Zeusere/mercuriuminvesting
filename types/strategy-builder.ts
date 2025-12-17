// Types for Visual Strategy Builder System

export type BlockType = 'asset' | 'weight' | 'conditional' | 'filter' | 'group'

export type WeightType = 'specified' | 'equal' | 'inverse_volatility' | 'market_cap'

export type ConditionalOperator = 'greater_than' | 'less_than' | 'equal' | 'greater_equal' | 'less_equal' | 'not_equal'

export type TechnicalIndicator = 
  | 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger_upper' | 'bollinger_lower'
  | 'volume' | 'price' | 'change_pct' | 'volatility'

export type FundamentalIndicator =
  | 'market_cap' | 'pe_ratio' | 'pb_ratio' | 'dividend_yield' | 'revenue_growth'
  | 'earnings_growth' | 'debt_to_equity' | 'roe' | 'roa'

export interface StrategyBlock {
  id: string
  type: BlockType
  parentId: string | null
  children: string[] // IDs of child blocks
  position?: { x: number; y: number }
  data: BlockData
}

export interface BlockData {
  // Asset Block
  asset?: {
    symbol: string
    name?: string
  }
  
  // Weight Block
  weight?: {
    type: WeightType
    value?: number // For specified weight (percentage)
    period?: number // For inverse volatility (e.g., 30 days)
  }
  
  // Conditional Block
  conditional?: {
    condition: ConditionalCondition
    trueBlockId?: string // Block to execute if true
    falseBlockId?: string // Block to execute if false
  }
  
  // Filter Block
  filter?: {
    criteria: FilterCriteria[]
    sortBy?: string
    limit?: number
  }
  
  // Group Block
  group?: {
    name: string
  }
}

export interface ConditionalCondition {
  leftOperand: {
    type: 'technical' | 'fundamental' | 'price' | 'custom'
    indicator?: TechnicalIndicator | FundamentalIndicator
    symbol?: string // For technical indicators on specific assets
    period?: number // For moving averages, etc.
  }
  operator: ConditionalOperator
  rightOperand: {
    type: 'value' | 'indicator' | 'constant'
    value?: number
    indicator?: TechnicalIndicator | FundamentalIndicator
    symbol?: string
    period?: number
  }
}

export interface FilterCriteria {
  field: TechnicalIndicator | FundamentalIndicator | 'symbol' | 'name'
  operator: ConditionalOperator
  value: number | string
}

export interface StrategyTree {
  rootBlockId: string
  blocks: { [blockId: string]: StrategyBlock }
}

export interface StrategyBuilderState {
  tree: StrategyTree
  selectedBlockId: string | null
  draggedBlockType: BlockType | null
}

// Example: "30% in gold ETF if EMA 20d > EMA 50d, else 30% in bonds"
// This would be represented as:
// - Root (Group)
//   - Weight (30%, specified)
//     - Conditional (EMA 20d > EMA 50d)
//       - True: Asset (Gold ETF)
//       - False: Asset (Bonds ETF)

