-- Automation System - Logs and Notifications
-- This migration creates infrastructure for automated strategy execution tracking

-- 1. Automation Logs (track all automation executions)
CREATE TABLE automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.active_strategies(id) ON DELETE CASCADE NOT NULL,
  
  -- Rule that triggered this execution
  rule_id VARCHAR(50) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
    'scheduled_rebalance',
    'threshold_deviation',
    'stop_loss',
    'take_profit',
    'ai_auto_optimize',
    'position_limit'
  )),
  
  -- Execution details
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_taken VARCHAR(50) NOT NULL CHECK (action_taken IN (
    'rebalance_to_target',
    'rebalance_equal_weight',
    'close_position',
    'close_strategy',
    'notify_only',
    'ai_optimize'
  )),
  
  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Trades executed (JSON array of trades)
  trades_executed JSONB,
  
  -- Impact metrics
  capital_before DECIMAL(15, 2),
  capital_after DECIMAL(15, 2),
  positions_changed INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notifications (in-app notifications for users)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'strategy_automation',
    'stop_loss',
    'take_profit',
    'threshold_alert',
    'ai_optimization',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Link to related resource
  link_url TEXT,
  
  -- Related entities
  strategy_id UUID REFERENCES public.active_strategies(id) ON DELETE SET NULL,
  automation_log_id UUID REFERENCES public.automation_logs(id) ON DELETE SET NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_automation_logs_strategy ON automation_logs(strategy_id, triggered_at DESC);
CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_type, triggered_at DESC);
CREATE INDEX idx_automation_logs_success ON automation_logs(success) WHERE success = false;

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_strategy ON notifications(strategy_id) WHERE strategy_id IS NOT NULL;

-- Row Level Security
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for automation_logs
CREATE POLICY "Users can view logs of their strategies."
ON automation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM active_strategies
    WHERE active_strategies.id = automation_logs.strategy_id
    AND active_strategies.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert logs."
ON automation_logs FOR INSERT
WITH CHECK (true);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications."
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications."
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications."
ON notifications FOR INSERT
WITH CHECK (true);

-- Function to count unread notifications
CREATE OR REPLACE FUNCTION get_unread_notification_count(uid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = uid AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE automation_logs IS 'Complete history of all automation rule executions for audit and debugging';
COMMENT ON TABLE notifications IS 'In-app notifications for users about strategy automations and alerts';

COMMENT ON COLUMN automation_logs.rule_id IS 'ID of the rule that triggered this execution';
COMMENT ON COLUMN automation_logs.success IS 'Whether the automation executed successfully';
COMMENT ON COLUMN automation_logs.trades_executed IS 'JSON array of trades that were executed';

COMMENT ON COLUMN notifications.is_read IS 'Whether user has read this notification';
COMMENT ON COLUMN notifications.link_url IS 'Deep link to related resource (e.g., /strategies/[id])';

