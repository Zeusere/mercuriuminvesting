import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AutomationRule } from '@/types/automation';

// GET /api/strategies/[id]/automation - Get automation configuration
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyId = params.id;

    // Fetch strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Parse automation_rules from JSONB
    const rules: AutomationRule[] = strategy.automation_rules || [];

    // Count total executions from logs
    const { count: totalExecutions } = await supabase
      .from('automation_logs')
      .select('id', { count: 'exact', head: true })
      .eq('strategy_id', strategyId);

    return NextResponse.json({
      strategy_id: strategyId,
      automation_enabled: strategy.automation_enabled || false,
      rules,
      last_automation_run: strategy.last_automation_run,
      next_automation_run: strategy.next_automation_run,
      total_executions: totalExecutions || 0,
    });

  } catch (error) {
    console.error('Error in GET /api/strategies/[id]/automation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/strategies/[id]/automation - Update automation configuration
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyId = params.id;
    const body = await request.json();
    const { automation_enabled, rules } = body;

    // Validate strategy ownership
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Validate rules format
    if (rules && !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Rules must be an array' },
        { status: 400 }
      );
    }

    // Calculate next_automation_run based on enabled rules
    let nextRun: Date | null = null;
    if (automation_enabled && rules && rules.length > 0) {
      nextRun = calculateNextAutomationRun(rules);
    }

    // Update strategy
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('active_strategies')
      .update({
        automation_enabled: automation_enabled || false,
        automation_rules: rules || [],
        next_automation_run: nextRun?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating automation config:', updateError);
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Automation configuration updated',
      strategy: updatedStrategy,
    });

  } catch (error) {
    console.error('Error in PATCH /api/strategies/[id]/automation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next automation run time
function calculateNextAutomationRun(rules: AutomationRule[]): Date | null {
  const now = new Date();
  const nextRuns: Date[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (rule.type === 'scheduled_rebalance') {
      const next = calculateNextScheduledRun(rule, now);
      if (next) nextRuns.push(next);
    }
    // threshold, stop_loss, take_profit need to be checked every run
    // so we add a near-future timestamp
    else {
      nextRuns.push(new Date(now.getTime() + 15 * 60 * 1000)); // Next 15 min
    }
  }

  if (nextRuns.length === 0) return null;

  // Return the earliest next run
  return new Date(Math.min(...nextRuns.map(d => d.getTime())));
}

function calculateNextScheduledRun(rule: AutomationRule, from: Date): Date | null {
  const config = rule.config;
  const targetTime = config.time || '09:30';
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);

  if (config.frequency === 'daily') {
    const next = new Date(from);
    next.setHours(targetHour, targetMinute, 0, 0);
    
    // If target time already passed today, schedule for tomorrow
    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (config.frequency === 'weekly') {
    const targetDay = config.day_of_week || 1; // Default Monday
    const next = new Date(from);
    next.setHours(targetHour, targetMinute, 0, 0);
    
    const currentDay = from.getDay() || 7; // Convert Sunday from 0 to 7
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    if (daysUntilTarget === 0 && next <= from) {
      // Target day is today but time passed, schedule for next week
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilTarget);
    }
    
    return next;
  }

  if (config.frequency === 'monthly') {
    const targetDay = config.day_of_month || 1;
    const next = new Date(from);
    next.setDate(targetDay);
    next.setHours(targetHour, targetMinute, 0, 0);
    
    // If target date already passed this month, schedule for next month
    if (next <= from) {
      next.setMonth(next.getMonth() + 1);
    }
    
    return next;
  }

  return null;
}

