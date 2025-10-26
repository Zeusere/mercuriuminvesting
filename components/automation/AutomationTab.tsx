'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, Calendar, AlertTriangle, TrendingDown, TrendingUp, 
  Brain, Shield, Loader2, Save, Info, CheckCircle, XCircle 
} from 'lucide-react';
import type { AutomationRule, StrategyAutomationConfig } from '@/types/automation';

interface AutomationTabProps {
  strategyId: string;
  userId: string;
}

export default function AutomationTab({ strategyId, userId }: AutomationTabProps) {
  const [config, setConfig] = useState<StrategyAutomationConfig | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, [strategyId]);

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/strategies/${strategyId}/automation`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching automation config:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/strategies/${strategyId}/automation/logs?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}/automation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_enabled: config?.automation_enabled || false,
          rules: config?.rules || [],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      alert('Automation settings saved successfully!');
      fetchConfig(); // Refresh to get updated next_automation_run
    } catch (error) {
      alert('Failed to save automation settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  function toggleAutomation() {
    if (config) {
      setConfig({ ...config, automation_enabled: !config.automation_enabled });
    }
  }

  function updateRule(ruleId: string, updates: Partial<AutomationRule>) {
    if (!config) return;
    setConfig({
      ...config,
      rules: config.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r),
    });
  }

  function addRule(type: string) {
    if (!config) return;
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      type: type as any,
      enabled: false,
      priority: config.rules.length + 1,
      config: getDefaultConfig(type),
      created_at: new Date().toISOString(),
      trigger_count: 0,
    };
    setConfig({
      ...config,
      rules: [...config.rules, newRule],
    });
  }

  function deleteRule(ruleId: string) {
    if (!config) return;
    if (!confirm('Delete this automation rule?')) return;
    setConfig({
      ...config,
      rules: config.rules.filter(r => r.id !== ruleId),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-primary-600" size={28} />
            <div>
              <h3 className="text-lg font-bold">Automation Enabled</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let the system execute trades automatically based on your rules
              </p>
            </div>
          </div>
          <button
            onClick={toggleAutomation}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config?.automation_enabled
                ? 'bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config?.automation_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config?.automation_enabled && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Next check:</strong> {config.next_automation_run ? new Date(config.next_automation_run).toLocaleString() : 'Not scheduled'}</p>
            <p><strong>Last run:</strong> {config.last_automation_run ? new Date(config.last_automation_run).toLocaleString() : 'Never'}</p>
            <p><strong>Total executions:</strong> {config.total_executions || 0}</p>
          </div>
        )}
      </div>

      {/* Rules Configuration */}
      {config?.automation_enabled && (
        <>
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Automation Rules</h3>
            
            {config.rules.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No rules configured yet. Add a rule to get started.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {config.rules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onUpdate={(updates) => updateRule(rule.id, updates)}
                    onDelete={() => deleteRule(rule.id)}
                  />
                ))}
              </div>
            )}

            {/* Add Rule Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Rule:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => addRule('scheduled_rebalance')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <Calendar size={16} />
                  Scheduled
                </button>
                <button
                  onClick={() => addRule('threshold_deviation')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <AlertTriangle size={16} />
                  Threshold
                </button>
                <button
                  onClick={() => addRule('stop_loss')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <TrendingDown size={16} />
                  Stop Loss
                </button>
                <button
                  onClick={() => addRule('take_profit')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <TrendingUp size={16} />
                  Take Profit
                </button>
                <button
                  onClick={() => addRule('ai_auto_optimize')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <Brain size={16} />
                  AI Optimize
                </button>
                <button
                  onClick={() => addRule('position_limit')}
                  className="btn-outline text-sm flex items-center gap-2 justify-center"
                >
                  <Shield size={16} />
                  Position Limit
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Automation Settings
              </>
            )}
          </button>
        </>
      )}

      {/* Automation History */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Automation History</h3>
        
        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No automation history yet
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  log.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {log.success ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{formatRuleType(log.rule_type)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.triggered_at).toLocaleString()}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{log.positions_changed || 0} trades</p>
                  {log.capital_after && log.capital_before && (
                    <p className={`text-xs ${
                      log.capital_after > log.capital_before
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      ${log.capital_before.toLocaleString()} → ${log.capital_after.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rule configuration card component
 */
function RuleCard({ rule, onUpdate, onDelete }: {
  rule: AutomationRule;
  onUpdate: (updates: Partial<AutomationRule>) => void;
  onDelete: () => void;
}) {
  const Icon = getRuleIcon(rule.type);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary-600" />
          <h4 className="font-semibold">{formatRuleType(rule.type)}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ enabled: !rule.enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              rule.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                rule.enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {rule.enabled && (
        <div className="space-y-3 pl-7">
          {/* Scheduled Rebalance Config */}
          {rule.type === 'scheduled_rebalance' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={rule.config.frequency || 'weekly'}
                  onChange={(e) => onUpdate({ config: { ...rule.config, frequency: e.target.value as any }})}
                  className="input-field text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {rule.config.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Week</label>
                  <select
                    value={rule.config.day_of_week || 1}
                    onChange={(e) => onUpdate({ config: { ...rule.config, day_of_week: parseInt(e.target.value) }})}
                    className="input-field text-sm"
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Time (Market Hours)</label>
                <input
                  type="time"
                  value={rule.config.time || '09:30'}
                  onChange={(e) => onUpdate({ config: { ...rule.config, time: e.target.value }})}
                  className="input-field text-sm"
                />
              </div>
            </>
          )}

          {/* Threshold Deviation Config */}
          {rule.type === 'threshold_deviation' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Max Deviation (%)</label>
                <input
                  type="number"
                  value={rule.config.max_deviation_pct || 10}
                  onChange={(e) => onUpdate({ config: { ...rule.config, max_deviation_pct: parseFloat(e.target.value) }})}
                  className="input-field text-sm"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rebalance Type</label>
                <select
                  value={rule.config.rebalance_type || 'to_target'}
                  onChange={(e) => onUpdate({ config: { ...rule.config, rebalance_type: e.target.value as any }})}
                  className="input-field text-sm"
                >
                  <option value="to_target">To Target Weights</option>
                  <option value="equal_weight">Equal Weight</option>
                </select>
              </div>
            </>
          )}

          {/* Stop Loss Config */}
          {rule.type === 'stop_loss' && (
            <div>
              <label className="block text-sm font-medium mb-1">Stop Loss Threshold (%)</label>
              <input
                type="number"
                value={rule.config.total_loss_pct || -15}
                onChange={(e) => onUpdate({ config: { ...rule.config, total_loss_pct: parseFloat(e.target.value) }})}
                className="input-field text-sm"
                max="0"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Close strategy if total return falls below this percentage
              </p>
            </div>
          )}

          {/* Take Profit Config */}
          {rule.type === 'take_profit' && (
            <div>
              <label className="block text-sm font-medium mb-1">Take Profit Threshold (%)</label>
              <input
                type="number"
                value={rule.config.total_gain_pct || 50}
                onChange={(e) => onUpdate({ config: { ...rule.config, total_gain_pct: parseFloat(e.target.value) }})}
                className="input-field text-sm"
                min="1"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Close strategy if total return exceeds this percentage
              </p>
            </div>
          )}

          {/* AI Auto Optimize Config */}
          {rule.type === 'ai_auto_optimize' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Optimization Frequency</label>
                <select
                  value={rule.config.ai_frequency || 'weekly'}
                  onChange={(e) => onUpdate({ config: { ...rule.config, ai_frequency: e.target.value as any }})}
                  className="input-field text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Confidence Score (%)</label>
                <input
                  type="number"
                  value={rule.config.min_confidence_score || 70}
                  onChange={(e) => onUpdate({ config: { ...rule.config, min_confidence_score: parseInt(e.target.value) }})}
                  className="input-field text-sm"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Trades per Execution</label>
                <input
                  type="number"
                  value={rule.config.max_trades_per_execution || 5}
                  onChange={(e) => onUpdate({ config: { ...rule.config, max_trades_per_execution: parseInt(e.target.value) }})}
                  className="input-field text-sm"
                  min="1"
                  max="20"
                />
              </div>
            </>
          )}

          {/* Position Limit Config */}
          {rule.type === 'position_limit' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Max Weight per Position (%)</label>
                <input
                  type="number"
                  value={rule.config.max_weight_per_position || 25}
                  onChange={(e) => onUpdate({ config: { ...rule.config, max_weight_per_position: parseFloat(e.target.value) }})}
                  className="input-field text-sm"
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.config.auto_rebalance_overweight || false}
                  onChange={(e) => onUpdate({ config: { ...rule.config, auto_rebalance_overweight: e.target.checked }})}
                  className="rounded"
                />
                <label className="text-sm">Auto-rebalance overweight positions</label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

{/* Helper Functions */}
function getRuleIcon(type: string) {
  switch (type) {
    case 'scheduled_rebalance': return Calendar;
    case 'threshold_deviation': return AlertTriangle;
    case 'stop_loss': return TrendingDown;
    case 'take_profit': return TrendingUp;
    case 'ai_auto_optimize': return Brain;
    case 'position_limit': return Shield;
    default: return Zap;
  }
}

function formatRuleType(type: string): string {
  switch (type) {
    case 'scheduled_rebalance': return 'Scheduled Rebalance';
    case 'threshold_deviation': return 'Threshold Deviation';
    case 'stop_loss': return 'Stop Loss';
    case 'take_profit': return 'Take Profit';
    case 'ai_auto_optimize': return 'AI Auto Optimize';
    case 'position_limit': return 'Position Limit';
    default: return type;
  }
}

function getDefaultConfig(type: string) {
  switch (type) {
    case 'scheduled_rebalance':
      return { frequency: 'weekly' as const, day_of_week: 1, time: '09:30', action: 'rebalance_to_target' as const };
    case 'threshold_deviation':
      return { max_deviation_pct: 10, rebalance_type: 'to_target' as const };
    case 'stop_loss':
      return { total_loss_pct: -15 };
    case 'take_profit':
      return { total_gain_pct: 50 };
    case 'ai_auto_optimize':
      return { ai_frequency: 'weekly' as const, min_confidence_score: 70, max_trades_per_execution: 5 };
    case 'position_limit':
      return { max_weight_per_position: 25, auto_rebalance_overweight: false };
    default:
      return {};
  }
}

