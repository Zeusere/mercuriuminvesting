// Types for Active Strategies System

export interface ActiveStrategy {
  id: string;
  portfolio_id: string | null;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string;
  initial_capital: number;
  current_capital: number | null;
  total_return_pct: number | null;
  is_paper_trading: boolean;
  broker_connection_id: string | null;
  automation_enabled: boolean;
  automation_rules: any | null;
  last_automation_run: string | null;
  next_automation_run: string | null;
  status: 'active' | 'paused' | 'closed';
  closed_at: string | null;
  closed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrategyPosition {
  id: string;
  strategy_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  cost_basis: number;
  current_price: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_pct: number | null;
  weight_pct: number | null;
  target_weight_pct: number | null;
  first_purchase_date: string;
  last_updated: string;
}

export interface StrategyTransaction {
  id: string;
  strategy_id: string;
  transaction_date: string;
  executed_at: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'FEE';
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  amount: number;
  fees: number;
  rebalance_id: string | null;
  notes: string | null;
  broker_transaction_id: string | null;
  synced_from_broker: boolean;
  created_at: string;
}

export interface StrategyRebalance {
  id: string;
  strategy_id: string;
  rebalance_date: string;
  capital_before: number;
  positions_before: any;
  capital_after: number;
  positions_after: any;
  transactions: any;
  reason: 'manual' | 'scheduled' | 'ai_recommendation' | 'threshold_breach' | 'initial';
  triggered_by: 'user' | 'automation' | 'system';
  notes: string | null;
  created_at: string;
}

export interface StrategyWithDetails extends ActiveStrategy {
  positions: StrategyPosition[];
  recent_transactions: StrategyTransaction[];
  portfolio?: {
    id: string;
    name: string;
    stocks: any[];
  };
}

export interface TradePreview {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  amount: number;
  reason?: string;
}

export interface AIStrategyRecommendation {
  message: string;
  trades: TradePreview[];
  impact: {
    estimated_return_change?: string;
    risk_change?: string;
    expected_allocation?: { [symbol: string]: number };
  };
}

