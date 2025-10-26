import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActiveStrategy, TradePreview } from '@/types/strategy';
import type { AutomationRule, AutomationAction, AutomationExecutionResult } from '@/types/automation';

/**
 * Execute an automation action
 */
export async function executeAutomationAction(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  action: AutomationAction,
  trades: TradePreview[]
): Promise<AutomationExecutionResult> {
  
  const supabase = createServerSupabaseClient();
  
  try {
    switch (action) {
      case 'rebalance_to_target':
      case 'rebalance_equal_weight':
      case 'ai_optimize':
        return await executeTrades(strategy, trades, rule.type);
      
      case 'close_strategy':
        return await closeStrategy(strategy, trades, rule.type);
      
      case 'close_position':
        return await executeTrades(strategy, trades, rule.type);
      
      case 'notify_only':
        // No action to execute, just notification (handled by caller)
        return {
          success: true,
          result: {
            action: 'notify_only',
            trades: [],
          },
        };
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error executing automation action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute trades via the execute-trades API
 */
async function executeTrades(
  strategy: ActiveStrategy,
  trades: TradePreview[],
  ruleType: string
): Promise<AutomationExecutionResult> {
  
  if (trades.length === 0) {
    return {
      success: true,
      result: {
        action: 'rebalance_to_target',
        trades: [],
        positions_changed: 0,
      },
    };
  }
  
  const capitalBefore = strategy.current_capital || strategy.initial_capital;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/strategies/${strategy.id}/execute-trades`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades,
          auto_execution: true,
          triggered_by: 'automation',
          rule_type: ruleType,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute trades');
    }
    
    const result = await response.json();
    
    // Fetch updated strategy to get new capital
    const supabase = createServerSupabaseClient();
    const { data: updatedStrategy } = await supabase
      .from('active_strategies')
      .select('current_capital')
      .eq('id', strategy.id)
      .single();
    
    const capitalAfter = updatedStrategy?.current_capital || capitalBefore;
    
    return {
      success: true,
      result: {
        action: 'rebalance_to_target',
        trades,
        capital_before: capitalBefore,
        capital_after: capitalAfter,
        positions_changed: trades.length,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute trades',
    };
  }
}

/**
 * Close strategy (sell all positions and mark as closed)
 */
async function closeStrategy(
  strategy: ActiveStrategy,
  trades: TradePreview[],
  ruleType: string
): Promise<AutomationExecutionResult> {
  
  const supabase = createServerSupabaseClient();
  const capitalBefore = strategy.current_capital || strategy.initial_capital;
  
  try {
    // Execute sell trades first
    if (trades.length > 0) {
      const tradesResult = await executeTrades(strategy, trades, ruleType);
      if (!tradesResult.success) {
        throw new Error(tradesResult.error || 'Failed to execute closing trades');
      }
    }
    
    // Mark strategy as closed
    const { error: closeError } = await supabase
      .from('active_strategies')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_reason: `Closed by automation: ${ruleType}`,
      })
      .eq('id', strategy.id);
    
    if (closeError) {
      throw new Error('Failed to close strategy');
    }
    
    // Calculate final capital (sum of all cash from sells)
    const capitalAfter = trades.reduce((sum, t) => {
      if (t.type === 'SELL') {
        return sum + (t.quantity! * t.price);
      }
      return sum;
    }, 0);
    
    return {
      success: true,
      result: {
        action: 'close_strategy',
        trades,
        capital_before: capitalBefore,
        capital_after: capitalAfter,
        positions_changed: trades.length,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close strategy',
    };
  }
}

/**
 * Log automation execution
 */
export async function logAutomationExecution(
  strategyId: string,
  rule: AutomationRule,
  result: AutomationExecutionResult
) {
  const supabase = createServerSupabaseClient();
  
  await supabase
    .from('automation_logs')
    .insert({
      strategy_id: strategyId,
      rule_id: rule.id,
      rule_type: rule.type,
      action_taken: result.result?.action || 'unknown',
      success: result.success,
      error_message: result.error,
      trades_executed: result.result?.trades || [],
      capital_before: result.result?.capital_before,
      capital_after: result.result?.capital_after,
      positions_changed: result.result?.positions_changed || 0,
    });
}

/**
 * Send notification to user
 */
export async function notifyUser(
  userId: string,
  data: {
    type: string;
    title: string;
    message: string;
    link_url?: string;
    strategy_id?: string;
    automation_log_id?: string;
  }
) {
  const supabase = createServerSupabaseClient();
  
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link_url: data.link_url,
      strategy_id: data.strategy_id,
      automation_log_id: data.automation_log_id,
    });
}

