-- Active Strategies System
-- This migration creates the infrastructure for live portfolio strategies

-- 1. Active Strategies (live instances of portfolios)
CREATE TABLE active_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  initial_capital DECIMAL(15, 2) NOT NULL,
  
  -- Current state (calculated)
  current_capital DECIMAL(15, 2),
  total_return_pct DECIMAL(10, 4),
  
  -- Type
  is_paper_trading BOOLEAN DEFAULT TRUE,
  broker_connection_id UUID, -- For future broker integration
  
  -- Automation (for future)
  automation_enabled BOOLEAN DEFAULT FALSE,
  automation_rules JSONB,
  last_automation_run TIMESTAMP WITH TIME ZONE,
  next_automation_run TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Strategy Positions (current holdings)
CREATE TABLE strategy_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.active_strategies(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  
  -- Entry data
  quantity DECIMAL(15, 6) NOT NULL,
  average_price DECIMAL(15, 4) NOT NULL,
  cost_basis DECIMAL(15, 2) NOT NULL,
  
  -- Current data (updated daily)
  current_price DECIMAL(15, 4),
  current_value DECIMAL(15, 2),
  
  -- Performance
  unrealized_pnl DECIMAL(15, 2),
  unrealized_pnl_pct DECIMAL(10, 4),
  
  -- Weight
  weight_pct DECIMAL(10, 4),
  target_weight_pct DECIMAL(10, 4),
  
  -- Metadata
  first_purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(strategy_id, symbol)
);

-- 3. Strategy Transactions (complete history)
CREATE TABLE strategy_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.active_strategies(id) ON DELETE CASCADE NOT NULL,
  
  -- Timing
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Type
  type VARCHAR(20) NOT NULL CHECK (type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'FEE')),
  
  -- Details
  symbol VARCHAR(10), -- NULL for DEPOSIT/WITHDRAWAL
  quantity DECIMAL(15, 6),
  price DECIMAL(15, 4),
  amount DECIMAL(15, 2) NOT NULL, -- Positive = money in, Negative = money out
  fees DECIMAL(15, 2) DEFAULT 0,
  
  -- Context
  rebalance_id UUID, -- Will reference strategy_rebalances
  notes TEXT,
  
  -- Broker integration (future)
  broker_transaction_id VARCHAR(100),
  synced_from_broker BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Strategy Rebalances (snapshots of changes)
CREATE TABLE strategy_rebalances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.active_strategies(id) ON DELETE CASCADE NOT NULL,
  rebalance_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- State before
  capital_before DECIMAL(15, 2) NOT NULL,
  positions_before JSONB NOT NULL,
  
  -- State after
  capital_after DECIMAL(15, 2) NOT NULL,
  positions_after JSONB NOT NULL,
  
  -- Changes
  transactions JSONB NOT NULL,
  
  -- Metadata
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('manual', 'scheduled', 'ai_recommendation', 'threshold_breach', 'initial')),
  triggered_by VARCHAR(50) NOT NULL CHECK (triggered_by IN ('user', 'automation', 'system')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for rebalance_id in transactions
ALTER TABLE strategy_transactions
ADD CONSTRAINT fk_transactions_rebalance 
FOREIGN KEY (rebalance_id) REFERENCES public.strategy_rebalances(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_active_strategies_user ON active_strategies(user_id, status);
CREATE INDEX idx_active_strategies_portfolio ON active_strategies(portfolio_id);
CREATE INDEX idx_active_strategies_status ON active_strategies(status) WHERE status = 'active';

CREATE INDEX idx_positions_strategy ON strategy_positions(strategy_id);
CREATE INDEX idx_positions_symbol ON strategy_positions(symbol);

CREATE INDEX idx_transactions_strategy ON strategy_transactions(strategy_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON strategy_transactions(type);

CREATE INDEX idx_rebalances_strategy ON strategy_rebalances(strategy_id, rebalance_date DESC);

-- Row Level Security
ALTER TABLE active_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_rebalances ENABLE ROW LEVEL SECURITY;

-- Policies for active_strategies
CREATE POLICY "Users can view their own strategies." 
ON active_strategies FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create strategies." 
ON active_strategies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies." 
ON active_strategies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies." 
ON active_strategies FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for strategy_positions
CREATE POLICY "Users can view positions of their strategies." 
ON strategy_positions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_positions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert positions." 
ON strategy_positions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_positions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can update positions." 
ON strategy_positions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_positions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can delete positions." 
ON strategy_positions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_positions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

-- Policies for strategy_transactions
CREATE POLICY "Users can view transactions of their strategies." 
ON strategy_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_transactions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert transactions." 
ON strategy_transactions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_transactions.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

-- Policies for strategy_rebalances
CREATE POLICY "Users can view rebalances of their strategies." 
ON strategy_rebalances FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_rebalances.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert rebalances." 
ON strategy_rebalances FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM active_strategies 
    WHERE active_strategies.id = strategy_rebalances.strategy_id 
    AND active_strategies.user_id = auth.uid()
  )
);

-- Function to update strategy capital
CREATE OR REPLACE FUNCTION update_strategy_capital()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate current_capital and total_return_pct for the strategy
  UPDATE active_strategies
  SET 
    current_capital = (
      SELECT COALESCE(SUM(current_value), 0)
      FROM strategy_positions
      WHERE strategy_id = NEW.strategy_id
    ),
    total_return_pct = (
      (
        SELECT COALESCE(SUM(current_value), 0)
        FROM strategy_positions
        WHERE strategy_id = NEW.strategy_id
      ) - initial_capital
    ) / initial_capital * 100,
    updated_at = NOW()
  WHERE id = NEW.strategy_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update strategy capital when positions change
CREATE TRIGGER update_strategy_capital_trigger
AFTER INSERT OR UPDATE OF current_value ON strategy_positions
FOR EACH ROW
EXECUTE FUNCTION update_strategy_capital();

-- Function to update position metrics
CREATE OR REPLACE FUNCTION update_position_metrics()
RETURNS TRIGGER AS $$
DECLARE
  total_portfolio_value DECIMAL(15, 2);
BEGIN
  -- Calculate unrealized P/L
  NEW.unrealized_pnl := NEW.current_value - NEW.cost_basis;
  NEW.unrealized_pnl_pct := (NEW.unrealized_pnl / NEW.cost_basis) * 100;
  
  -- Calculate weight in portfolio
  SELECT COALESCE(SUM(current_value), 0) INTO total_portfolio_value
  FROM strategy_positions
  WHERE strategy_id = NEW.strategy_id;
  
  IF total_portfolio_value > 0 THEN
    NEW.weight_pct := (NEW.current_value / total_portfolio_value) * 100;
  ELSE
    NEW.weight_pct := 0;
  END IF;
  
  NEW.last_updated := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update position metrics
CREATE TRIGGER update_position_metrics_trigger
BEFORE INSERT OR UPDATE OF current_price, quantity ON strategy_positions
FOR EACH ROW
EXECUTE FUNCTION update_position_metrics();

-- Comments for documentation
COMMENT ON TABLE active_strategies IS 'Live portfolio strategies with real capital tracking';
COMMENT ON TABLE strategy_positions IS 'Current holdings in active strategies';
COMMENT ON TABLE strategy_transactions IS 'Complete transaction history for audit and performance tracking';
COMMENT ON TABLE strategy_rebalances IS 'Snapshots of portfolio rebalances for historical analysis';

