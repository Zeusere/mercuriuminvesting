import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateRule } from '@/lib/automation/rule-evaluator';
import { executeAutomationAction, logAutomationExecution, notifyUser } from '@/lib/automation/action-executor';
import type { AutomationRule } from '@/types/automation';

/**
 * Cron endpoint - runs every 15 minutes to check and execute automation rules
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-automations",
 *     "schedule": "* /15 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const executionLog: Array<{
      strategy: string;
      rule: string;
      result: string;
      error?: string;
    }> = [];

    console.log('[AUTOMATION CRON] Starting automation check...');

    // 1. Fetch strategies with automation enabled
    // Only fetch those whose next_automation_run has passed
    const { data: strategies, error: strategiesError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('automation_enabled', true)
      .eq('status', 'active')
      .lte('next_automation_run', new Date().toISOString());

    if (strategiesError) {
      console.error('[AUTOMATION CRON] Error fetching strategies:', strategiesError);
      return NextResponse.json(
        { error: 'Failed to fetch strategies' },
        { status: 500 }
      );
    }

    if (!strategies || strategies.length === 0) {
      console.log('[AUTOMATION CRON] No strategies ready for automation');
      return NextResponse.json({
        message: 'No strategies ready for automation',
        checked: 0,
        executions: [],
      });
    }

    console.log(`[AUTOMATION CRON] Found ${strategies.length} strategies to check`);

    // 2. For each strategy, evaluate and execute rules
    for (const strategy of strategies) {
      console.log(`[AUTOMATION CRON] Checking strategy: ${strategy.name} (${strategy.id})`);
      
      const rules = (strategy.automation_rules as AutomationRule[]) || [];
      
      if (rules.length === 0) {
        console.log(`[AUTOMATION CRON] No rules configured for ${strategy.name}`);
        continue;
      }

      // Fetch current positions
      const { data: positions } = await supabase
        .from('strategy_positions')
        .select('*')
        .eq('strategy_id', strategy.id);

      if (!positions) {
        console.log(`[AUTOMATION CRON] No positions for ${strategy.name}`);
        continue;
      }

      // Update positions with current prices
      await updatePositionPrices(strategy.id, positions);

      // Re-fetch positions with updated prices
      const { data: updatedPositions } = await supabase
        .from('strategy_positions')
        .select('*')
        .eq('strategy_id', strategy.id);

      // Evaluate each enabled rule
      for (const rule of rules.filter(r => r.enabled)) {
        try {
          console.log(`[AUTOMATION CRON] Evaluating rule: ${rule.type} for ${strategy.name}`);
          
          const evaluation = await evaluateRule(strategy, rule, updatedPositions || []);
          
          if (!evaluation.shouldExecute) {
            console.log(`[AUTOMATION CRON] Rule ${rule.type} not triggered: ${evaluation.reason}`);
            executionLog.push({
              strategy: strategy.name,
              rule: rule.type,
              result: 'SKIPPED',
            });
            continue;
          }
          
          console.log(`[AUTOMATION CRON] Rule ${rule.type} TRIGGERED: ${evaluation.reason}`);
          
          // Execute action
          const executionResult = await executeAutomationAction(
            strategy,
            rule,
            evaluation.action!,
            evaluation.trades || []
          );
          
          // Log execution
          await logAutomationExecution(strategy.id, rule, executionResult);
          
          // Notify user
          await notifyUser(strategy.user_id, {
            type: getNotificationType(rule.type),
            title: `Strategy Automated: ${strategy.name}`,
            message: `${rule.type}: ${evaluation.reason}. ${
              executionResult.success 
                ? `Executed ${executionResult.result?.positions_changed || 0} trades.` 
                : `Failed: ${executionResult.error}`
            }`,
            link_url: `/strategies/${strategy.id}`,
            strategy_id: strategy.id,
          });
          
          executionLog.push({
            strategy: strategy.name,
            rule: rule.type,
            result: executionResult.success ? 'SUCCESS' : 'FAILED',
            error: executionResult.error,
          });
          
          console.log(`[AUTOMATION CRON] Rule ${rule.type} executed: ${executionResult.success ? 'SUCCESS' : 'FAILED'}`);
          
        } catch (error) {
          console.error(`[AUTOMATION CRON] Error evaluating rule ${rule.type}:`, error);
          executionLog.push({
            strategy: strategy.name,
            rule: rule.type,
            result: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      // Update last_automation_run and recalculate next_automation_run
      const nextRun = calculateNextRun(rules);
      
      await supabase
        .from('active_strategies')
        .update({
          last_automation_run: new Date().toISOString(),
          next_automation_run: nextRun?.toISOString() || null,
        })
        .eq('id', strategy.id);
    }

    const duration = Date.now() - startTime;
    console.log(`[AUTOMATION CRON] Completed in ${duration}ms. Checked ${strategies.length} strategies.`);

    return NextResponse.json({
      message: 'Automation check completed',
      checked: strategies.length,
      executions: executionLog,
      duration_ms: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AUTOMATION CRON] Fatal error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

/**
 * Update position prices before evaluation
 */
async function updatePositionPrices(strategyId: string, positions: any[]) {
  const supabase = createServerSupabaseClient();
  
  for (const position of positions) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${position.symbol}`
      );
      const data = await response.json();
      const currentPrice = data.c || 0;
      
      if (currentPrice > 0) {
        const currentValue = position.quantity * currentPrice;
        await supabase
          .from('strategy_positions')
          .update({
            current_price: currentPrice,
            current_value: currentValue,
          })
          .eq('id', position.id);
      }
    } catch (error) {
      console.error(`Error updating price for ${position.symbol}:`, error);
    }
  }
}

/**
 * Calculate next automation run based on rules
 */
function calculateNextRun(rules: AutomationRule[]): Date | null {
  const now = new Date();
  const nextRuns: Date[] = [];

  for (const rule of rules.filter(r => r.enabled)) {
    if (rule.type === 'scheduled_rebalance') {
      const next = calculateNextScheduledRun(rule);
      if (next) nextRuns.push(next);
    } else {
      // Condition-based rules need to be checked every cycle
      nextRuns.push(new Date(now.getTime() + 15 * 60 * 1000));
    }
  }

  if (nextRuns.length === 0) return null;
  return new Date(Math.min(...nextRuns.map(d => d.getTime())));
}

function calculateNextScheduledRun(rule: AutomationRule): Date | null {
  const now = new Date();
  const config = rule.config;
  const targetTime = config.time || '09:30';
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);

  if (config.frequency === 'daily') {
    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (config.frequency === 'weekly') {
    const targetDay = config.day_of_week || 1;
    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);
    const currentDay = now.getDay() || 7;
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    if (daysUntilTarget === 0 && next <= now) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilTarget);
    }
    return next;
  }

  if (config.frequency === 'monthly') {
    const targetDay = config.day_of_month || 1;
    const next = new Date(now);
    next.setDate(targetDay);
    next.setHours(targetHour, targetMinute, 0, 0);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  return null;
}

function getNotificationType(ruleType: string): string {
  switch (ruleType) {
    case 'stop_loss': return 'stop_loss';
    case 'take_profit': return 'take_profit';
    case 'threshold_deviation': return 'threshold_alert';
    case 'ai_auto_optimize': return 'ai_optimization';
    default: return 'strategy_automation';
  }
}

