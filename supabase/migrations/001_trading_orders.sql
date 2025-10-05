-- Create trading_orders table
CREATE TABLE IF NOT EXISTS public.trading_orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  type TEXT NOT NULL CHECK (type IN ('MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT')),
  quantity INTEGER,
  amount DECIMAL(12, 2),
  price DECIMAL(12, 4),
  stop_loss JSONB,
  take_profit JSONB,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'FILLED', 'CANCELLED', 'REJECTED')),
  raw_input TEXT NOT NULL,
  parsed_intent TEXT NOT NULL,
  broker_order_id TEXT,
  execution_price DECIMAL(12, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS trading_orders_user_id_idx ON public.trading_orders(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS trading_orders_status_idx ON public.trading_orders(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS trading_orders_created_at_idx ON public.trading_orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own orders
CREATE POLICY "Users can view their own orders"
  ON public.trading_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON public.trading_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own orders
CREATE POLICY "Users can update their own orders"
  ON public.trading_orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own orders
CREATE POLICY "Users can delete their own orders"
  ON public.trading_orders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create broker_configs table (for future use)
CREATE TABLE IF NOT EXISTS public.broker_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_sandbox BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, broker_name)
);

-- Create index on user_id for broker_configs
CREATE INDEX IF NOT EXISTS broker_configs_user_id_idx ON public.broker_configs(user_id);

-- Enable Row Level Security for broker_configs
ALTER TABLE public.broker_configs ENABLE ROW LEVEL SECURITY;

-- Policies for broker_configs
CREATE POLICY "Users can view their own broker configs"
  ON public.broker_configs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own broker configs"
  ON public.broker_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker configs"
  ON public.broker_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own broker configs"
  ON public.broker_configs
  FOR DELETE
  USING (auth.uid() = user_id);

