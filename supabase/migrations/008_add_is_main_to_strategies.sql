-- Add is_main field to active_strategies
ALTER TABLE active_strategies
ADD COLUMN is_main BOOLEAN DEFAULT FALSE;

-- Create unique constraint to ensure only one main strategy per user
CREATE UNIQUE INDEX idx_one_main_strategy_per_user 
ON active_strategies(user_id, is_main) 
WHERE is_main = TRUE AND status = 'active';

-- Function to set a strategy as main (and unset others)
CREATE OR REPLACE FUNCTION set_main_strategy(strategy_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Unset all other main strategies for this user
  UPDATE active_strategies
  SET is_main = FALSE
  WHERE user_id = user_id_param AND id != strategy_id_param;
  
  -- Set this strategy as main
  UPDATE active_strategies
  SET is_main = TRUE
  WHERE id = strategy_id_param AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatically set first active strategy as main for each user
UPDATE active_strategies
SET is_main = TRUE
WHERE id IN (
  SELECT DISTINCT ON (user_id) id
  FROM active_strategies
  WHERE status = 'active'
  ORDER BY user_id, created_at ASC
);

COMMENT ON COLUMN active_strategies.is_main IS 'Indicates if this is the user''s main strategy to display on dashboard and profile';

