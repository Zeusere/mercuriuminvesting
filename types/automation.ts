// Types for Strategy Automation System

export type AutomationRuleType =
  | 'scheduled_rebalance'    // Rebalancear en horario específico
  | 'threshold_deviation'    // Rebalancear si peso se desvía > X%
  | 'stop_loss'             // Cerrar estrategia si cae > X%
  | 'take_profit'           // Cerrar estrategia si sube > X%
  | 'ai_auto_optimize'      // AI decide trades automáticamente
  | 'position_limit';       // Limitar peso máximo por posición

export type AutomationAction =
  | 'rebalance_to_target'      // Rebalancear a pesos objetivo
  | 'rebalance_equal_weight'   // Rebalancear a pesos iguales
  | 'close_position'           // Cerrar posición específica
  | 'close_strategy'           // Cerrar estrategia completa
  | 'notify_only'              // Solo notificar, no ejecutar
  | 'ai_optimize';             // Ejecutar sugerencias de AI

export interface AutomationRuleConfig {
  // SCHEDULED REBALANCE
  frequency?: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number; // 1-7 (1=Monday, 7=Sunday)
  day_of_month?: number; // 1-31
  time?: string; // "09:30" (hora del mercado)
  action?: AutomationAction;
  
  // THRESHOLD DEVIATION
  max_deviation_pct?: number; // e.g., 10 = rebalance if any position deviates >10%
  rebalance_type?: 'to_target' | 'equal_weight';
  
  // STOP LOSS
  total_loss_pct?: number; // e.g., -15 = close if portfolio drops 15%
  position_loss_pct?: number; // e.g., -20 = close position if drops 20%
  affected_symbols?: string[]; // Para stop loss por posición
  
  // TAKE PROFIT
  total_gain_pct?: number; // e.g., 50 = close if portfolio gains 50%
  position_gain_pct?: number; // e.g., 30 = sell position if gains 30%
  affected_symbols?: string[]; // Para take profit por posición
  
  // AI AUTO OPTIMIZE
  min_confidence_score?: number; // 0-100, only execute if AI confidence > this
  max_trades_per_execution?: number; // e.g., 3
  ai_frequency?: 'daily' | 'weekly' | 'monthly';
  
  // POSITION LIMIT
  max_weight_per_position?: number; // e.g., 25 = no position can exceed 25%
  auto_rebalance_overweight?: boolean;
}

export interface AutomationRule {
  id: string; // UUID para identificar cada regla
  type: AutomationRuleType;
  enabled: boolean;
  priority: number; // 1-10, mayor = más importante (para resolver conflictos)
  
  config: AutomationRuleConfig;
  
  // Metadata
  last_triggered?: string;
  trigger_count?: number;
  created_at: string;
  updated_at?: string;
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
  created_at: string;
}

export interface StrategyAutomationConfig {
  strategy_id: string;
  automation_enabled: boolean;
  rules: AutomationRule[];
  last_automation_run?: string;
  next_automation_run?: string;
  total_executions: number;
}

export interface AutomationNotification {
  id: string;
  user_id: string;
  type: 'strategy_automation' | 'stop_loss' | 'take_profit' | 'threshold_alert' | 'ai_optimization';
  title: string;
  message: string;
  link_url?: string;
  strategy_id?: string;
  automation_log_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface RuleEvaluationResult {
  shouldExecute: boolean;
  action: AutomationAction | null;
  reason: string;
  trades?: any[];
  confidence?: number; // Para AI rules
}

export interface AutomationExecutionResult {
  success: boolean;
  error?: string;
  result?: {
    action: AutomationAction;
    trades?: any[];
    capital_before?: number;
    capital_after?: number;
    positions_changed?: number;
  };
}

// Helper types for UI
export interface AutomationRuleTemplate {
  type: AutomationRuleType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: AutomationRuleConfig;
  configFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'time';
    options?: Array<{ value: string | number; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
  }>;
}

