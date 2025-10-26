'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  RotateCw
} from 'lucide-react';

interface AutomationRule {
  id?: string;
  type: 'stop_loss' | 'threshold_deviation' | 'scheduled_rebalance' | 'take_profit' | 'ai_auto_optimize' | 'position_limit';
  enabled: boolean;
  config: {
    threshold?: number;
    frequency?: 'daily' | 'weekly' | 'monthly';
    time?: string;
    rebalance_type?: 'equal_weight' | 'target_weight';
    max_deviation?: number;
    position_limit?: number;
  };
  last_triggered?: string;
}

interface AutomationConfig {
  automation_enabled: boolean;
  last_automation_run?: string;
  next_automation_run?: string;
  rules?: AutomationRule[];
}

interface AutomationLog {
  id: string;
  action_type: string;
  status: 'success' | 'error';
  message?: string;
  created_at: string;
}

interface AutomationSidebarProps {
  strategyId: string;
  strategyName: string;
  isAutomationEnabled: boolean;
  onToggleAutomation: (enabled: boolean) => void;
  onSaveChanges: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function AutomationSidebar({
  strategyId,
  strategyName,
  isAutomationEnabled,
  onToggleAutomation,
  onSaveChanges,
  onUndo,
  onRedo
}: AutomationSidebarProps) {
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch automation config and logs
  useEffect(() => {
    if (strategyId) {
      fetchAutomationData();
    }
  }, [strategyId]);

  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch(`/api/strategies/${strategyId}/automation`),
        fetch(`/api/strategies/${strategyId}/automation/logs`)
      ]);
      
      if (configRes.ok) {
        const config = await configRes.json();
        setAutomationConfig(config);
        setRules(config.rules || []);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.slice(0, 5)); // Show last 5 logs
      }
    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = (type: AutomationRule['type']) => {
    const newRule: AutomationRule = {
      type,
      enabled: true,
      config: getDefaultConfig(type)
    };
    setRules([...rules, newRule]);
    setHasChanges(true);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateRule = (index: number, updates: Partial<AutomationRule>) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    setRules(updatedRules);
    setHasChanges(true);
  };

  const getDefaultConfig = (type: AutomationRule['type']) => {
    switch (type) {
      case 'stop_loss':
        return { threshold: -15 };
      case 'threshold_deviation':
        return { max_deviation: 10, rebalance_type: 'equal_weight' as const };
      case 'scheduled_rebalance':
        return { frequency: 'daily' as const, time: '09:30' };
      case 'take_profit':
        return { threshold: 20 };
      case 'position_limit':
        return { position_limit: 10 };
      default:
        return {};
    }
  };

  const saveRules = async () => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}/automation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: rules,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        await fetchAutomationData(); // Refresh data
        onSaveChanges();
      } else {
        console.error('Failed to save rules');
      }
    } catch (error) {
      console.error('Error saving rules:', error);
    }
  };

  const getRuleIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'stop_loss': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'threshold_deviation': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'scheduled_rebalance': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'take_profit': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'ai_auto_optimize': return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case 'position_limit': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRuleStatus = (rule: { enabled: boolean; last_triggered?: string }) => {
    if (!rule.enabled) return { text: 'Disabled', color: 'bg-gray-100 text-gray-600' };
    if (rule.last_triggered) return { text: 'Active', color: 'bg-green-100 text-green-600' };
    return { text: 'Ready', color: 'bg-blue-100 text-blue-600' };
  };

  const formatLastRun = (timestamp: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 p-3 space-y-3 overflow-y-auto">
      {/* Action Controls Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4 space-y-3">
          <Button 
            onClick={saveRules}
            disabled={!hasChanges}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:dark:bg-gray-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onUndo}
              className="flex-1 border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              onClick={onRedo}
              className="flex-1 border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Redo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation Status Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Automation Status</h3>
            <div className="flex items-center space-x-2">
              {isAutomationEnabled ? (
                <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Pause className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <Badge 
              className={isAutomationEnabled 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }
            >
              {isAutomationEnabled ? 'Active' : 'Paused'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Run</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {automationConfig?.last_automation_run 
                ? formatLastRun(automationConfig.last_automation_run)
                : 'Never'
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Next Run</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {automationConfig?.next_automation_run 
                ? formatLastRun(automationConfig.next_automation_run)
                : 'Not scheduled'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules Configuration */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">Automation Rules</h3>
            <div className="relative">
              <select
                onChange={(e) => {
                  const type = e.target.value as AutomationRule['type'];
                  if (type) {
                    addRule(type);
                    e.target.value = ''; // Reset selection
                  }
                }}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm pr-8 text-gray-900 dark:text-white"
                defaultValue=""
              >
                <option value="" disabled>Add Rule...</option>
                <option value="stop_loss">Stop Loss</option>
                <option value="threshold_deviation">Threshold Deviation</option>
                <option value="scheduled_rebalance">Scheduled Rebalance</option>
                <option value="take_profit">Take Profit</option>
                <option value="position_limit">Position Limit</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {rules.length > 0 ? (
            rules.map((rule, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getRuleIcon(rule.type)}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {rule.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => updateRule(index, { enabled: e.target.checked })}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">Enabled</span>
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeRule(index)}
                      className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Rule Configuration */}
                <div className="space-y-2">
                  {rule.type === 'stop_loss' && (
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Stop Loss Threshold (%)</label>
                      <input
                        type="number"
                        value={rule.config.threshold || -15}
                        onChange={(e) => updateRule(index, { 
                          config: { ...rule.config, threshold: parseFloat(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="-15"
                      />
                    </div>
                  )}
                  
                  {rule.type === 'threshold_deviation' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Max Deviation (%)</label>
                        <input
                          type="number"
                          value={rule.config.max_deviation || 10}
                          onChange={(e) => updateRule(index, { 
                            config: { ...rule.config, max_deviation: parseFloat(e.target.value) }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Rebalance Type</label>
                        <select
                          value={rule.config.rebalance_type || 'equal_weight'}
                          onChange={(e) => updateRule(index, { 
                            config: { ...rule.config, rebalance_type: e.target.value as 'equal_weight' | 'target_weight' }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="equal_weight">Equal Weight</option>
                          <option value="target_weight">Target Weight</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {rule.type === 'scheduled_rebalance' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Frequency</label>
                        <select
                          value={rule.config.frequency || 'daily'}
                          onChange={(e) => updateRule(index, { 
                            config: { ...rule.config, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Time (Market Hours)</label>
                        <input
                          type="time"
                          value={rule.config.time || '09:30'}
                          onChange={(e) => updateRule(index, { 
                            config: { ...rule.config, time: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                  
                  {rule.type === 'take_profit' && (
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Take Profit Threshold (%)</label>
                      <input
                        type="number"
                        value={rule.config.threshold || 20}
                        onChange={(e) => updateRule(index, { 
                          config: { ...rule.config, threshold: parseFloat(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="20"
                      />
                    </div>
                  )}
                  
                  {rule.type === 'position_limit' && (
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Max Position Limit (%)</label>
                      <input
                        type="number"
                        value={rule.config.position_limit || 10}
                        onChange={(e) => updateRule(index, { 
                          config: { ...rule.config, position_limit: parseFloat(e.target.value) }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="10"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Settings className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No rules configured</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addRule('stop_loss')}
                className="mt-2 border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {logs.length > 0 ? (
            logs.map((log, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex-shrink-0 mt-1">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.action_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatLastRun(log.created_at)}
                  </p>
                  {log.message && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {log.message}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Clock className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Quick Actions</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Button 
            variant="outline" 
            className="w-full border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => fetchAutomationData()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => onToggleAutomation(!isAutomationEnabled)}
          >
            {isAutomationEnabled ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Automation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Automation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
