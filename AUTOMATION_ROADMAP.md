# ⚡ Estrategias Automatizadas - Roadmap Completo

Sistema completo de automatización para ejecutar estrategias de inversión de forma autónoma con reglas configurables.

---

## 📋 **Tabla de Contenidos**

1. [Arquitectura General](#arquitectura-general)
2. [Fase 1: Tipos y Base de Datos](#fase-1-tipos-y-base-de-datos)
3. [Fase 2: APIs de Configuración](#fase-2-apis-de-configuración)
4. [Fase 3: Motor de Evaluación](#fase-3-motor-de-evaluación)
5. [Fase 4: Worker/Cron Job](#fase-4-workercron-job)
6. [Fase 5: UI de Configuración](#fase-5-ui-de-configuración)
7. [Fase 6: Sistema de Notificaciones](#fase-6-sistema-de-notificaciones)
8. [Fase 7: Testing y Validación](#fase-7-testing-y-validación)

---

## 🏗️ **Arquitectura General**

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Dashboard    │  │ Strategy     │  │ Notifications│      │
│  │              │  │ Config UI    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────┬────────────────┬─────────────┘
             │                │                │
             ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APIs                             │
│  GET /strategies/[id]/automation                             │
│  PATCH /strategies/[id]/automation (save config)             │
│  GET /notifications                                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                       │
│  • active_strategies (automation_enabled, automation_rules)  │
│  • automation_logs (new table)                               │
│  • notifications (new table)                                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKGROUND WORKER (Cron/Inngest)                │
│                                                               │
│  Every 15 minutes:                                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. Fetch strategies WHERE automation_enabled=true  │     │
│  │ 2. For each strategy:                              │     │
│  │    - Evaluate all active rules                     │     │
│  │    - If conditions met → Execute action            │     │
│  │    - Log result                                    │     │
│  │    - Send notification                             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 **Fase 1: Tipos y Base de Datos**

### **1.1 - Crear Tipos TypeScript** ✏️

**Archivo:** `types/automation.ts`

```typescript
export type AutomationRuleType =
  | 'scheduled_rebalance'
  | 'threshold_deviation'
  | 'stop_loss'
  | 'take_profit'
  | 'ai_auto_optimize'
  | 'position_limit';

export type AutomationAction =
  | 'rebalance_to_target'
  | 'rebalance_equal_weight'
  | 'close_position'
  | 'close_strategy'
  | 'notify_only'
  | 'ai_optimize';

export interface AutomationRule {
  id: string; // UUID para identificar cada regla
  type: AutomationRuleType;
  enabled: boolean;
  priority: number; // 1-10, mayor = más importante
  
  // Configuración específica por tipo
  config: {
    // SCHEDULED REBALANCE
    frequency?: 'daily' | 'weekly' | 'monthly';
    day_of_week?: number; // 1-7 (Monday-Sunday)
    day_of_month?: number; // 1-31
    time?: string; // "09:30" (hora de mercado)
    action?: AutomationAction;
    
    // THRESHOLD DEVIATION
    max_deviation_pct?: number; // e.g., 10 = rebalance if any position deviates >10%
    rebalance_type?: 'to_target' | 'equal_weight';
    
    // STOP LOSS
    total_loss_pct?: number; // e.g., -15 = close if portfolio drops 15%
    position_loss_pct?: number; // e.g., -20 = close position if drops 20%
    
    // TAKE PROFIT
    total_gain_pct?: number; // e.g., 50 = close if portfolio gains 50%
    position_gain_pct?: number; // e.g., 30 = sell position if gains 30%
    
    // AI AUTO OPTIMIZE
    min_confidence_score?: number; // 0-100, only execute if AI confidence > this
    max_trades_per_execution?: number; // e.g., 3
    frequency?: 'daily' | 'weekly' | 'monthly';
    
    // POSITION LIMIT
    max_weight_per_position?: number; // e.g., 25 = no position can exceed 25%
    auto_rebalance_overweight?: boolean;
  };
  
  // Metadata
  last_triggered?: string;
  trigger_count?: number;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  strategy_id: string;
  rule_id: string;
  rule_type: AutomationRuleType;
  triggered_at: string;
  action_taken: AutomationAction;
  success: boolean;
  error_message?: string;
  trades_executed?: any[];
  impact?: {
    capital_before: number;
    capital_after: number;
    positions_changed: number;
  };
}

export interface StrategyAutomationConfig {
  strategy_id: string;
  automation_enabled: boolean;
  rules: AutomationRule[];
  last_check: string;
  next_check: string;
  total_executions: number;
}
```

### **1.2 - Migración SQL para Logs y Notificaciones** 📝

**Archivo:** `supabase/migrations/010_automation_system.sql`

```sql
-- Automation Logs (track all automation executions)
CREATE TABLE automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES active_strategies(id) ON DELETE CASCADE NOT NULL,
  
  -- Rule that triggered
  rule_id VARCHAR(50) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  
  -- Execution details
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_taken VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Trades executed
  trades_executed JSONB,
  
  -- Impact
  capital_before DECIMAL(15, 2),
  capital_after DECIMAL(15, 2),
  positions_changed INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications for users
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  type VARCHAR(50) NOT NULL, -- 'strategy_automation', 'stop_loss', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Link
  link_url TEXT,
  
  -- Related entities
  strategy_id UUID REFERENCES active_strategies(id) ON DELETE SET NULL,
  automation_log_id UUID REFERENCES automation_logs(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_automation_logs_strategy ON automation_logs(strategy_id, triggered_at DESC);
CREATE INDEX idx_automation_logs_success ON automation_logs(success) WHERE success = false;
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their strategies" ON automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM active_strategies
      WHERE active_strategies.id = automation_logs.strategy_id
      AND active_strategies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🔌 **Fase 2: APIs de Configuración**

### **2.1 - Obtener Configuración de Automatización**

**Archivo:** `app/api/strategies/[id]/automation/route.ts`

```typescript
// GET /api/strategies/[id]/automation
export async function GET(request: Request, { params }) {
  // 1. Auth check
  // 2. Fetch strategy
  // 3. Parse automation_rules JSON
  // 4. Return config
  
  return NextResponse.json({
    automation_enabled: strategy.automation_enabled,
    rules: strategy.automation_rules || [],
    last_automation_run: strategy.last_automation_run,
    next_automation_run: strategy.next_automation_run,
  });
}
```

### **2.2 - Guardar Configuración**

```typescript
// PATCH /api/strategies/[id]/automation
export async function PATCH(request: Request, { params }) {
  const { automation_enabled, rules } = await request.json();
  
  // 1. Validar reglas (formato correcto, valores válidos)
  // 2. Calcular next_automation_run basado en reglas
  // 3. Update en DB
  
  await supabase
    .from('active_strategies')
    .update({
      automation_enabled,
      automation_rules: rules,
      next_automation_run: calculateNextRun(rules),
    })
    .eq('id', strategyId);
}
```

### **2.3 - API de Notificaciones**

**Archivo:** `app/api/notifications/route.ts`

```typescript
// GET /api/notifications - User's notifications
export async function GET(request: Request) {
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
    
  return NextResponse.json({ notifications });
}

// PATCH /api/notifications/[id]/read - Mark as read
export async function PATCH(request: Request, { params }) {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id);
}
```

---

## 🧠 **Fase 3: Motor de Evaluación**

### **3.1 - Lógica de Evaluación de Reglas**

**Archivo:** `lib/automation/rule-evaluator.ts`

```typescript
export async function evaluateRule(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<{
  shouldExecute: boolean;
  action: AutomationAction | null;
  reason: string;
  trades?: TradePreview[];
}> {
  
  switch (rule.type) {
    case 'scheduled_rebalance':
      return evaluateScheduledRebalance(strategy, rule);
      
    case 'threshold_deviation':
      return evaluateThresholdDeviation(strategy, rule, positions);
      
    case 'stop_loss':
      return evaluateStopLoss(strategy, rule);
      
    case 'take_profit':
      return evaluateTakeProfit(strategy, rule);
      
    case 'ai_auto_optimize':
      return evaluateAIOptimize(strategy, rule, positions);
      
    case 'position_limit':
      return evaluatePositionLimit(strategy, rule, positions);
  }
}
```

### **3.2 - Evaluadores Específicos**

**A) Scheduled Rebalance:**
```typescript
async function evaluateScheduledRebalance(
  strategy: ActiveStrategy,
  rule: AutomationRule
): Promise<EvaluationResult> {
  
  const now = new Date();
  const lastRun = strategy.last_automation_run 
    ? new Date(strategy.last_automation_run) 
    : null;
  
  // Check if it's time to run
  let shouldRun = false;
  
  if (rule.config.frequency === 'daily') {
    const targetTime = rule.config.time || '09:30';
    const [hour, minute] = targetTime.split(':').map(Number);
    const isTargetTime = now.getHours() === hour && now.getMinutes() >= minute;
    const ranToday = lastRun && isSameDay(lastRun, now);
    shouldRun = isTargetTime && !ranToday;
  }
  
  if (rule.config.frequency === 'weekly') {
    const targetDay = rule.config.day_of_week || 1; // Monday
    const isTargetDay = now.getDay() === targetDay;
    const ranThisWeek = lastRun && isSameWeek(lastRun, now);
    shouldRun = isTargetDay && !ranThisWeek;
  }
  
  if (shouldRun) {
    // Generate rebalance trades
    const trades = await generateRebalanceTrades(strategy, rule.config.action);
    return {
      shouldExecute: true,
      action: rule.config.action || 'rebalance_to_target',
      reason: `Scheduled ${rule.config.frequency} rebalance`,
      trades,
    };
  }
  
  return { shouldExecute: false, action: null, reason: 'Not time yet' };
}
```

**B) Threshold Deviation:**
```typescript
async function evaluateThresholdDeviation(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<EvaluationResult> {
  
  const maxDeviation = rule.config.max_deviation_pct || 10;
  
  // Check if any position deviates more than threshold
  const deviations = positions.map(p => ({
    symbol: p.symbol,
    current_weight: p.weight_pct || 0,
    target_weight: p.target_weight_pct || 0,
    deviation: Math.abs((p.weight_pct || 0) - (p.target_weight_pct || 0)),
  }));
  
  const maxDeviationFound = Math.max(...deviations.map(d => d.deviation));
  
  if (maxDeviationFound > maxDeviation) {
    const trades = await generateRebalanceTrades(
      strategy, 
      rule.config.rebalance_type === 'equal_weight' 
        ? 'rebalance_equal_weight' 
        : 'rebalance_to_target'
    );
    
    return {
      shouldExecute: true,
      action: 'rebalance_to_target',
      reason: `Position deviation of ${maxDeviationFound.toFixed(2)}% exceeds threshold of ${maxDeviation}%`,
      trades,
    };
  }
  
  return { shouldExecute: false, action: null, reason: 'Within threshold' };
}
```

**C) Stop Loss:**
```typescript
async function evaluateStopLoss(
  strategy: ActiveStrategy,
  rule: AutomationRule
): Promise<EvaluationResult> {
  
  const currentReturn = strategy.total_return_pct || 0;
  const stopLossThreshold = rule.config.total_loss_pct || -15;
  
  if (currentReturn <= stopLossThreshold) {
    return {
      shouldExecute: true,
      action: 'close_strategy',
      reason: `Stop loss triggered: ${currentReturn.toFixed(2)}% <= ${stopLossThreshold}%`,
      trades: [], // Will close all positions
    };
  }
  
  return { shouldExecute: false, action: null, reason: 'Above stop loss threshold' };
}
```

**D) Take Profit:**
```typescript
async function evaluateTakeProfit(
  strategy: ActiveStrategy,
  rule: AutomationRule
): Promise<EvaluationResult> {
  
  const currentReturn = strategy.total_return_pct || 0;
  const takeProfitThreshold = rule.config.total_gain_pct || 50;
  
  if (currentReturn >= takeProfitThreshold) {
    return {
      shouldExecute: true,
      action: 'close_strategy',
      reason: `Take profit triggered: ${currentReturn.toFixed(2)}% >= ${takeProfitThreshold}%`,
      trades: [], // Will close all positions and lock in gains
    };
  }
  
  return { shouldExecute: false, action: null, reason: 'Below take profit threshold' };
}
```

**E) AI Auto Optimize:**
```typescript
async function evaluateAIOptimize(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  positions: StrategyPosition[]
): Promise<EvaluationResult> {
  
  // Check if enough time has passed since last optimization
  const frequency = rule.config.frequency || 'weekly';
  const lastRun = strategy.last_automation_run ? new Date(strategy.last_automation_run) : null;
  
  let shouldRun = false;
  if (frequency === 'weekly' && (!lastRun || daysBetween(lastRun, new Date()) >= 7)) {
    shouldRun = true;
  }
  
  if (!shouldRun) {
    return { shouldExecute: false, action: null, reason: 'Too soon' };
  }
  
  // Ask AI for recommendations
  const aiResponse = await fetch('/api/ai/strategy-assistant', {
    method: 'POST',
    body: JSON.stringify({
      strategy_id: strategy.id,
      user_message: 'Analyze my strategy and suggest optimizations for better performance',
      auto_mode: true,
    }),
  });
  
  const aiData = await aiResponse.json();
  
  // Check if AI has high confidence
  const confidence = aiData.confidence_score || 0;
  const minConfidence = rule.config.min_confidence_score || 70;
  
  if (confidence < minConfidence) {
    return {
      shouldExecute: false,
      action: null,
      reason: `AI confidence ${confidence}% below threshold ${minConfidence}%`,
    };
  }
  
  // Limit number of trades
  const maxTrades = rule.config.max_trades_per_execution || 5;
  const trades = (aiData.trades || []).slice(0, maxTrades);
  
  return {
    shouldExecute: true,
    action: 'ai_optimize',
    reason: `AI suggests ${trades.length} trades with ${confidence}% confidence`,
    trades,
  };
}
```

### **3.3 - Generador de Trades de Rebalanceo**

**Archivo:** `lib/automation/trade-generator.ts`

```typescript
export async function generateRebalanceTrades(
  strategy: ActiveStrategy,
  action: AutomationAction
): Promise<TradePreview[]> {
  
  // Fetch current positions and prices
  const positions = await fetchPositions(strategy.id);
  const prices = await fetchCurrentPrices(positions.map(p => p.symbol));
  
  // Calculate target state based on action
  let targetWeights: Record<string, number> = {};
  
  if (action === 'rebalance_to_target') {
    // Use target_weight_pct from positions
    positions.forEach(p => {
      targetWeights[p.symbol] = p.target_weight_pct || 0;
    });
  } else if (action === 'rebalance_equal_weight') {
    // Equal weight for all positions
    const equalWeight = 100 / positions.length;
    positions.forEach(p => {
      targetWeights[p.symbol] = equalWeight;
    });
  }
  
  // Calculate trades needed
  const totalValue = strategy.current_capital || strategy.initial_capital;
  const trades: TradePreview[] = [];
  
  positions.forEach(position => {
    const currentValue = position.quantity * (prices[position.symbol] || 0);
    const targetValue = (targetWeights[position.symbol] / 100) * totalValue;
    const difference = targetValue - currentValue;
    
    if (Math.abs(difference) > 10) { // Only if difference > $10
      if (difference < 0) {
        // Need to SELL
        const sharesToSell = Math.abs(difference) / prices[position.symbol];
        trades.push({
          type: 'SELL',
          symbol: position.symbol,
          quantity: sharesToSell,
          price: prices[position.symbol],
          amount: Math.abs(difference),
          reason: 'Rebalance (over-weighted)',
        });
      } else {
        // Need to BUY
        trades.push({
          type: 'BUY',
          symbol: position.symbol,
          amount: difference,
          price: prices[position.symbol],
          reason: 'Rebalance (under-weighted)',
        });
      }
    }
  });
  
  return trades;
}
```

---

## ⚙️ **Fase 4: Worker/Cron Job**

### **4.1 - Vercel Cron Endpoint**

**Archivo:** `app/api/cron/check-automations/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateRule } from '@/lib/automation/rule-evaluator';

export async function GET(request: Request) {
  // Verificar autenticación de Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const executionLog = [];

  try {
    // 1. Obtener todas las estrategias con automation_enabled = true
    const { data: strategies } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('automation_enabled', true)
      .eq('status', 'active');

    if (!strategies || strategies.length === 0) {
      return NextResponse.json({ 
        message: 'No strategies with automation enabled',
        checked: 0 
      });
    }

    // 2. Para cada estrategia, evaluar reglas
    for (const strategy of strategies) {
      const rules = strategy.automation_rules as AutomationRule[] || [];
      
      // Obtener posiciones actuales
      const { data: positions } = await supabase
        .from('strategy_positions')
        .select('*')
        .eq('strategy_id', strategy.id);

      // Evaluar cada regla activa
      for (const rule of rules.filter(r => r.enabled)) {
        try {
          const evaluation = await evaluateRule(strategy, rule, positions || []);
          
          if (evaluation.shouldExecute) {
            // Ejecutar acción
            const result = await executeAutomationAction(
              strategy,
              rule,
              evaluation.action,
              evaluation.trades || []
            );
            
            // Log resultado
            await logAutomation(strategy.id, rule, result);
            
            // Notificar usuario
            await notifyUser(strategy.user_id, {
              type: 'strategy_automation',
              title: `Strategy Automated: ${strategy.name}`,
              message: `${rule.type}: ${evaluation.reason}`,
              link_url: `/strategies/${strategy.id}`,
              strategy_id: strategy.id,
            });
            
            executionLog.push({
              strategy: strategy.name,
              rule: rule.type,
              result: result.success ? 'SUCCESS' : 'FAILED',
            });
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.type} for ${strategy.id}:`, error);
          executionLog.push({
            strategy: strategy.name,
            rule: rule.type,
            result: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown',
          });
        }
      }
      
      // Update last_automation_run
      await supabase
        .from('active_strategies')
        .update({ 
          last_automation_run: new Date().toISOString(),
          next_automation_run: calculateNextRun(rules),
        })
        .eq('id', strategy.id);
    }

    return NextResponse.json({
      message: 'Automation check completed',
      checked: strategies.length,
      executions: executionLog,
    });

  } catch (error) {
    console.error('Error in automation cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **4.2 - Ejecutor de Acciones**

**Archivo:** `lib/automation/action-executor.ts`

```typescript
export async function executeAutomationAction(
  strategy: ActiveStrategy,
  rule: AutomationRule,
  action: AutomationAction,
  trades: TradePreview[]
): Promise<{ success: boolean; error?: string; result?: any }> {
  
  try {
    switch (action) {
      case 'rebalance_to_target':
      case 'rebalance_equal_weight':
      case 'ai_optimize':
        // Execute trades via existing API
        const tradeResult = await fetch(`/api/strategies/${strategy.id}/execute-trades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trades,
            auto_execution: true,
            triggered_by: 'automation',
            rule_type: rule.type,
          }),
        });
        
        if (!tradeResult.ok) {
          throw new Error('Failed to execute trades');
        }
        
        return { success: true, result: await tradeResult.json() };
      
      case 'close_strategy':
        // Close all positions and mark strategy as closed
        const closeResult = await closeStrategy(strategy.id, rule.type);
        return { success: true, result: closeResult };
      
      case 'close_position':
        // Close specific position
        // Implementation depends on which position to close
        return { success: true };
      
      case 'notify_only':
        // No action, just notification (already handled by caller)
        return { success: true };
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### **4.3 - Logger**

**Archivo:** `lib/automation/logger.ts`

```typescript
export async function logAutomation(
  strategyId: string,
  rule: AutomationRule,
  result: { success: boolean; error?: string; result?: any }
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
      positions_changed: result.result?.trades?.length || 0,
    });
}
```

### **4.4 - Configurar Vercel Cron**

**Archivo:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-automations",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Environment Variable:**
```env
CRON_SECRET=your-random-secret-here
```

---

## 🎨 **Fase 5: UI de Configuración**

### **5.1 - Tab de Automation en Strategy Viewer**

**Archivo:** `components/automation/AutomationTab.tsx`

```tsx
interface AutomationTabProps {
  strategyId: string;
  userId: string;
}

export default function AutomationTab({ strategyId, userId }: AutomationTabProps) {
  const [config, setConfig] = useState<StrategyAutomationConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Automation Enabled</h3>
            <p className="text-sm text-gray-600">
              Let the system execute trades automatically based on your rules
            </p>
          </div>
          <Toggle
            enabled={config?.automation_enabled || false}
            onChange={handleToggleAutomation}
          />
        </div>
      </div>

      {/* Rules Configuration */}
      {config?.automation_enabled && (
        <>
          <ScheduledRebalanceCard />
          <ThresholdDeviationCard />
          <StopLossCard />
          <TakeProfitCard />
          <AIAutoOptimizeCard />
        </>
      )}

      {/* Automation Logs */}
      <AutomationLogsTable strategyId={strategyId} />

      {/* Save Button */}
      <button onClick={handleSave} className="btn-primary">
        Save Automation Settings
      </button>
    </div>
  );
}
```

### **5.2 - Cards de Configuración de Reglas**

**Ejemplo: ScheduledRebalanceCard**

```tsx
function ScheduledRebalanceCard({ rule, onChange }: RuleCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-primary-600" size={24} />
          <div>
            <h3 className="font-bold">Scheduled Rebalance</h3>
            <p className="text-sm text-gray-600">
              Automatically rebalance at specific intervals
            </p>
          </div>
        </div>
        <Toggle enabled={rule.enabled} onChange={() => onChange({ ...rule, enabled: !rule.enabled })} />
      </div>

      {rule.enabled && (
        <div className="space-y-4 pl-10">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <select
              value={rule.config.frequency}
              onChange={(e) => onChange({ ...rule, config: { ...rule.config, frequency: e.target.value }})}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Day of Week (if weekly) */}
          {rule.config.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Day of Week</label>
              <select className="input-field">
                <option value="1">Monday</option>
                <option value="5">Friday</option>
              </select>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Time (Market Hours)</label>
            <input
              type="time"
              value={rule.config.time || '09:30'}
              className="input-field"
            />
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium mb-2">Rebalance Type</label>
            <select className="input-field">
              <option value="rebalance_to_target">To Target Weights</option>
              <option value="rebalance_equal_weight">Equal Weight</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
```

### **5.3 - Tabla de Logs de Automatización**

```tsx
function AutomationLogsTable({ strategyId }: { strategyId: string }) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [strategyId]);

  async function fetchLogs() {
    const res = await fetch(`/api/strategies/${strategyId}/automation/logs`);
    const data = await res.json();
    setLogs(data.logs || []);
  }

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Automation History</h3>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <div>
              <p className="font-semibold text-sm">{log.rule_type}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(log.triggered_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {log.success ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
              <span className="text-sm">{log.positions_changed} trades</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔔 **Fase 6: Sistema de Notificaciones**

### **6.1 - Bell Icon en Navigation**

```tsx
// components/Navigation.tsx
<Link href="/notifications" className="relative">
  <Bell size={20} />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</Link>
```

### **6.2 - Página de Notificaciones**

**Archivo:** `app/notifications/page.tsx`

```tsx
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  return (
    <div className="space-y-3">
      {notifications.map(notif => (
        <div className={`card ${notif.is_read ? 'opacity-60' : ''}`}>
          <div className="flex items-start gap-3">
            <NotificationIcon type={notif.type} />
            <div className="flex-1">
              <h3 className="font-bold">{notif.title}</h3>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(notif.created_at)}
              </p>
            </div>
            {notif.link_url && (
              <Link href={notif.link_url} className="btn-outline text-sm">
                View
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **6.3 - Email Notifications (opcional)**

Usar Resend para enviar emails:

```typescript
// lib/notifications/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAutomationEmail(
  userEmail: string,
  data: {
    strategyName: string;
    action: string;
    result: string;
    link: string;
  }
) {
  await resend.emails.send({
    from: 'notifications@yourdomain.com',
    to: userEmail,
    subject: `Strategy Automated: ${data.strategyName}`,
    html: `
      <h2>Your strategy "${data.strategyName}" was automatically ${data.action}</h2>
      <p>${data.result}</p>
      <a href="${data.link}">View Strategy</a>
    `,
  });
}
```

---

## 🧪 **Fase 7: Testing y Validación**

### **7.1 - Testing Manual**

**Test Cases:**

1. **Scheduled Rebalance:**
   - Configurar rebalanceo semanal los lunes 9:30
   - Esperar a que corra el cron
   - Verificar que se ejecutó y se registró en logs

2. **Threshold Deviation:**
   - Configurar umbral de 10%
   - Simular movimiento de mercado que cause desviación
   - Verificar que se rebalancea automáticamente

3. **Stop Loss:**
   - Configurar stop loss de -15%
   - Simular caída del portfolio
   - Verificar que cierra la estrategia

4. **AI Auto Optimize:**
   - Configurar optimización semanal con AI
   - Verificar que AI genera trades
   - Verificar que se ejecutan si confianza > threshold

### **7.2 - Safety Checks**

```typescript
// Validaciones críticas antes de ejecutar:
- ✅ Strategy status = 'active'
- ✅ automation_enabled = true
- ✅ Rule enabled = true
- ✅ No ejecuciones duplicadas (check last_automation_run)
- ✅ Trades balance correctamente (sells = buys)
- ✅ Capital suficiente
- ✅ Market hours (para trades reales)
```

---

## 📊 **Resumen de Archivos a Crear/Modificar**

### **Nuevos Archivos (20):**

```
types/automation.ts

supabase/migrations/010_automation_system.sql

lib/automation/rule-evaluator.ts
lib/automation/action-executor.ts
lib/automation/trade-generator.ts
lib/automation/logger.ts
lib/notifications/email.ts

app/api/strategies/[id]/automation/route.ts
app/api/strategies/[id]/automation/logs/route.ts
app/api/cron/check-automations/route.ts
app/api/notifications/route.ts
app/api/notifications/[id]/read/route.ts

components/automation/AutomationTab.tsx
components/automation/ScheduledRebalanceCard.tsx
components/automation/ThresholdDeviationCard.tsx
components/automation/StopLossCard.tsx
components/automation/TakeProfitCard.tsx
components/automation/AIAutoOptimizeCard.tsx
components/automation/AutomationLogsTable.tsx

app/notifications/page.tsx

vercel.json (add cron config)
```

### **Modificar Existentes (3):**

```
components/ActiveStrategyViewer.tsx (add Automation tab)
app/api/strategies/[id]/execute-trades/route.ts (add auto_execution flag)
components/Navigation.tsx (add notifications bell)
```

---

## ⏱️ **Estimación de Tiempo por Fase**

| Fase | Tareas | Tiempo Estimado | Complejidad |
|------|--------|-----------------|-------------|
| **Fase 1** | Tipos + Migración SQL | 2-3 horas | Baja |
| **Fase 2** | APIs de Config (4 endpoints) | 3-4 horas | Media |
| **Fase 3** | Motor de Evaluación (6 evaluadores) | 6-8 horas | Alta |
| **Fase 4** | Worker + Ejecutor | 4-6 horas | Alta |
| **Fase 5** | UI (8 componentes) | 8-10 horas | Media |
| **Fase 6** | Notificaciones | 2-3 horas | Baja |
| **Fase 7** | Testing | 3-4 horas | Media |
| **TOTAL** | | **28-38 horas** | **~5-7 días** |

---

## 🎯 **Orden de Implementación Recomendado**

### **Día 1-2: Base**
1. ✅ Tipos TypeScript (`types/automation.ts`)
2. ✅ Migración SQL (`010_automation_system.sql`)
3. ✅ APIs de configuración (GET/PATCH automation)
4. ✅ API de logs (GET logs)

### **Día 3-4: Lógica Core**
5. ✅ Rule evaluators (6 evaluadores)
6. ✅ Trade generator
7. ✅ Action executor
8. ✅ Logger

### **Día 5-6: Worker + UI**
9. ✅ Cron endpoint
10. ✅ UI components (8 cards + tab)
11. ✅ Integrar en ActiveStrategyViewer

### **Día 7: Polish + Testing**
12. ✅ Notifications system
13. ✅ Email notifications (opcional)
14. ✅ Testing manual
15. ✅ Documentación

---

## 🚀 **Quick Start - Primera Regla en 30 minutos**

Si quieres ver algo funcionando rápido, podemos hacer una **versión minimal** de scheduled rebalance:

1. Agregar toggle en UI: "Auto-rebalance weekly"
2. Guardar en `automation_rules` como JSON simple
3. Cron que corre cada 15 min y ejecuta si es lunes + no corrió esta semana
4. Enviar email de confirmación

**¿Empezamos con esto o con el sistema completo?**

---

## 💡 **Recomendaciones Adicionales**

### **Seguridad:**
- Dry-run mode (simular sin ejecutar)
- Límite de trades por día/semana
- Confirmación por email para acciones críticas (stop loss)
- Pause automático si muchos errores consecutivos

### **Monitoreo:**
- Dashboard de automation performance
- Gráfico de "returns antes/después de automation"
- Alertas si automation falla repetidamente

### **UX:**
- Wizard para configurar primera vez
- Templates de reglas ("Conservative", "Aggressive", "Balanced")
- Preview de "qué pasaría si" antes de activar

---

## 📝 **Siguiente Paso Inmediato**

¿Comenzamos con:

**A)** Implementación completa fase por fase (Día 1-2 primero)
**B)** Quick start minimal para ver algo funcionando ya
**C)** Revisar/ajustar el esquema antes de empezar

**Dime A, B o C y arrancamos.** 🚀

