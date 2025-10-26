import type { ActiveStrategy, StrategyPosition } from '@/types/strategy';
import type { AutomationRule, RuleEvaluationResult, AutomationAction } from '@/types/automation';
import { generateRebalanceTrades, generateCloseAllTrades } from './trade-generator';
import { isSameDay, isSameWeek, isSameMonth, differenceInDays } from 'date-fns';

/**
 * Main evaluator - determines if a rule should execute
 */
export async function evaluateRule(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  if (!rule.enabled) {
    return {
      shouldExecute: false,
      action: null,
      reason: 'Rule is disabled',
    };
  }

  switch (rule.type) {
    case 'scheduled_rebalance':
      return await evaluateScheduledRebalance(strategy, rule, positions);
      
    case 'threshold_deviation':
      return await evaluateThresholdDeviation(strategy, rule, positions);
      
    case 'stop_loss':
      return await evaluateStopLoss(strategy, rule, positions);
      
    case 'take_profit':
      return await evaluateTakeProfit(strategy, rule, positions);
      
    case 'ai_auto_optimize':
      return await evaluateAIOptimize(strategy, rule, positions);
      
    case 'position_limit':
      return await evaluatePositionLimit(strategy, rule, positions);
      
    default:
      return {
        shouldExecute: false,
        action: null,
        reason: `Unknown rule type: ${rule.type}`,
      };
  }
}

/**
 * Evaluate scheduled rebalance rule
 */
async function evaluateScheduledRebalance(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const now = new Date();
  const lastRun = strategy.last_automation_run ? new Date(strategy.last_automation_run) : null;
  
  const config = rule.config;
  const targetTime = config.time || '09:30';
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if we're within the target time window (15-minute window)
  const isWithinTimeWindow = 
    currentHour === targetHour && 
    currentMinute >= targetMinute && 
    currentMinute < targetMinute + 15;
  
  let shouldRun = false;
  let periodLabel = '';
  
  if (config.frequency === 'daily') {
    const ranToday = lastRun && isSameDay(lastRun, now);
    shouldRun = isWithinTimeWindow && !ranToday;
    periodLabel = 'daily';
  }
  
  if (config.frequency === 'weekly') {
    const targetDay = config.day_of_week || 1; // Default Monday
    const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
    const isTargetDay = currentDay === targetDay;
    const ranThisWeek = lastRun && isSameWeek(lastRun, now, { weekStartsOn: 1 });
    shouldRun = isTargetDay && isWithinTimeWindow && !ranThisWeek;
    periodLabel = 'weekly';
  }
  
  if (config.frequency === 'monthly') {
    const targetDayOfMonth = config.day_of_month || 1;
    const currentDayOfMonth = now.getDate();
    const isTargetDay = currentDayOfMonth === targetDayOfMonth;
    const ranThisMonth = lastRun && isSameMonth(lastRun, now);
    shouldRun = isTargetDay && isWithinTimeWindow && !ranThisMonth;
    periodLabel = 'monthly';
  }
  
  if (!shouldRun) {
    return {
      shouldExecute: false,
      action: null,
      reason: `Not time for ${periodLabel} rebalance yet`,
    };
  }
  
  // Generate rebalance trades
  const action = config.action || 'rebalance_to_target';
  const trades = await generateRebalanceTrades(strategy, action, positions);
  
  if (trades.length === 0) {
    return {
      shouldExecute: false,
      action: null,
      reason: 'Portfolio already balanced, no trades needed',
    };
  }
  
  return {
    shouldExecute: true,
    action,
    reason: `Scheduled ${periodLabel} rebalance at ${targetTime}`,
    trades,
  };
}

/**
 * Evaluate threshold deviation rule
 */
async function evaluateThresholdDeviation(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const maxDeviation = rule.config.max_deviation_pct || 10;
  
  // Calculate current deviations
  const deviations = positions.map(p => ({
    symbol: p.symbol,
    current_weight: p.weight_pct || 0,
    target_weight: p.target_weight_pct || 0,
    deviation: Math.abs((p.weight_pct || 0) - (p.target_weight_pct || 0)),
  }));
  
  // Find maximum deviation
  const maxDeviationFound = Math.max(...deviations.map(d => d.deviation), 0);
  const deviatingSymbol = deviations.find(d => d.deviation === maxDeviationFound);
  
  if (maxDeviationFound <= maxDeviation) {
    return {
      shouldExecute: false,
      action: null,
      reason: `Max deviation ${maxDeviationFound.toFixed(2)}% is within threshold ${maxDeviation}%`,
    };
  }
  
  // Generate rebalance trades
  const rebalanceType = rule.config.rebalance_type === 'equal_weight' 
    ? 'rebalance_equal_weight' 
    : 'rebalance_to_target';
    
  const trades = await generateRebalanceTrades(strategy, rebalanceType, positions);
  
  return {
    shouldExecute: true,
    action: rebalanceType,
    reason: `${deviatingSymbol?.symbol} deviated ${maxDeviationFound.toFixed(2)}% (threshold: ${maxDeviation}%)`,
    trades,
  };
}

/**
 * Evaluate stop loss rule
 */
async function evaluateStopLoss(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const currentReturn = strategy.total_return_pct || 0;
  const stopLossThreshold = rule.config.total_loss_pct || -15;
  
  if (currentReturn > stopLossThreshold) {
    return {
      shouldExecute: false,
      action: null,
      reason: `Return ${currentReturn.toFixed(2)}% is above stop loss threshold ${stopLossThreshold}%`,
    };
  }
  
  // Generate trades to close all positions
  const trades = await generateCloseAllTrades(positions);
  
  return {
    shouldExecute: true,
    action: 'close_strategy',
    reason: `Stop loss triggered: ${currentReturn.toFixed(2)}% <= ${stopLossThreshold}%`,
    trades,
  };
}

/**
 * Evaluate take profit rule
 */
async function evaluateTakeProfit(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const currentReturn = strategy.total_return_pct || 0;
  const takeProfitThreshold = rule.config.total_gain_pct || 50;
  
  if (currentReturn < takeProfitThreshold) {
    return {
      shouldExecute: false,
      action: null,
      reason: `Return ${currentReturn.toFixed(2)}% is below take profit threshold ${takeProfitThreshold}%`,
    };
  }
  
  // Generate trades to close all positions (lock in gains)
  const trades = await generateCloseAllTrades(positions);
  
  return {
    shouldExecute: true,
    action: 'close_strategy',
    reason: `Take profit triggered: ${currentReturn.toFixed(2)}% >= ${takeProfitThreshold}%`,
    trades,
  };
}

/**
 * Evaluate AI auto optimize rule
 */
async function evaluateAIOptimize(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const lastRun = strategy.last_automation_run ? new Date(strategy.last_automation_run) : null;
  const daysSinceLastRun = lastRun ? differenceInDays(new Date(), lastRun) : 999;
  
  const frequency = rule.config.ai_frequency || 'weekly';
  let minDaysRequired = 7; // weekly
  if (frequency === 'daily') minDaysRequired = 1;
  if (frequency === 'monthly') minDaysRequired = 30;
  
  if (daysSinceLastRun < minDaysRequired) {
    return {
      shouldExecute: false,
      action: null,
      reason: `Too soon since last AI optimization (${daysSinceLastRun} days < ${minDaysRequired})`,
    };
  }
  
  // Ask AI for recommendations
  try {
    const aiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/strategy-assistant`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: strategy.id,
          user_message: 'Analyze my strategy and suggest optimizations for better performance. Be specific with trade recommendations.',
          auto_mode: true,
        }),
      }
    );
    
    if (!aiResponse.ok) {
      throw new Error('AI request failed');
    }
    
    const aiData = await aiResponse.json();
    const trades = aiData.trades || [];
    
    // For now, we don't have confidence score from AI
    // In a real implementation, the AI should return a confidence score
    const confidence = 75; // Placeholder
    const minConfidence = rule.config.min_confidence_score || 70;
    
    if (confidence < minConfidence) {
      return {
        shouldExecute: false,
        action: null,
        reason: `AI confidence ${confidence}% below threshold ${minConfidence}%`,
        confidence,
      };
    }
    
    // Limit number of trades
    const maxTrades = rule.config.max_trades_per_execution || 5;
    const limitedTrades = trades.slice(0, maxTrades);
    
    if (limitedTrades.length === 0) {
      return {
        shouldExecute: false,
        action: null,
        reason: 'AI suggests no changes at this time',
        confidence,
      };
    }
    
    return {
      shouldExecute: true,
      action: 'ai_optimize',
      reason: `AI suggests ${limitedTrades.length} trades with ${confidence}% confidence`,
      trades: limitedTrades,
      confidence,
    };
    
  } catch (error) {
    console.error('Error in AI optimization:', error);
    return {
      shouldExecute: false,
      action: null,
      reason: `AI evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Evaluate position limit rule
 */
async function evaluatePositionLimit(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<RuleEvaluationResult> {
  
  const maxWeight = rule.config.max_weight_per_position || 25;
  
  // Find positions that exceed the limit
  const overweightPositions = positions.filter(p => (p.weight_pct || 0) > maxWeight);
  
  if (overweightPositions.length === 0) {
    return {
      shouldExecute: false,
      action: null,
      reason: `All positions within ${maxWeight}% limit`,
    };
  }
  
  if (!rule.config.auto_rebalance_overweight) {
    // Just notify, don't execute
    const symbols = overweightPositions.map(p => p.symbol).join(', ');
    return {
      shouldExecute: true,
      action: 'notify_only',
      reason: `Positions exceeding ${maxWeight}% limit: ${symbols}`,
      trades: [],
    };
  }
  
  // Auto-rebalance to bring overweight positions down
  const trades = await generateRebalanceTrades(strategy, 'rebalance_to_target', positions);
  
  return {
    shouldExecute: true,
    action: 'rebalance_to_target',
    reason: `${overweightPositions.length} positions exceed ${maxWeight}% limit`,
    trades,
  };
}

