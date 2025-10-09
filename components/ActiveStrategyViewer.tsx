'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Navigation from './Navigation';
import { 
  Loader2, ArrowLeft, AlertCircle, TrendingUp, TrendingDown, 
  DollarSign, Activity, AlertTriangle, MessageSquare, Send, 
  CheckCircle, PauseCircle, XCircle, Edit3, BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Link from 'next/link';
import type { ActiveStrategy, StrategyPosition, StrategyTransaction, AIStrategyRecommendation, TradePreview } from '@/types/strategy';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  trades?: TradePreview[];
  impact?: any;
}

interface ActiveStrategyViewerProps {
  user: User;
  strategyId: string;
}

export default function ActiveStrategyViewer({ user, strategyId }: ActiveStrategyViewerProps) {
  const router = useRouter();
  const [strategy, setStrategy] = useState<ActiveStrategy | null>(null);
  const [positions, setPositions] = useState<StrategyPosition[]>([]);
  const [transactions, setTransactions] = useState<StrategyTransaction[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Trade execution state
  const [pendingTrades, setPendingTrades] = useState<TradePreview[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetchStrategyData();
  }, [strategyId]);

  async function fetchStrategyData() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${strategyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch strategy');
      }

      const data = await response.json();
      setStrategy(data.strategy);
      setPositions(data.positions || []);
      setTransactions(data.transactions || []);
      setPortfolio(data.portfolio);

      // Initialize AI chat with context
      if (data.strategy && messages.length === 0) {
        const totalReturn = data.strategy.total_return_pct || 0;
        const returnText = totalReturn > 0 ? `up ${totalReturn.toFixed(2)}%` : `down ${Math.abs(totalReturn).toFixed(2)}%`;
        
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your AI Strategy Assistant. Your strategy "${data.strategy.name}" is currently ${returnText} since ${format(new Date(data.strategy.start_date), 'MMM d, yyyy')}. I can help you optimize your positions, analyze performance, or make strategic adjustments. What would you like to do?`
        }]);
      }

    } catch (err) {
      console.error('Error fetching strategy:', err);
      setError(err instanceof Error ? err.message : 'Failed to load strategy');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!userInput.trim() || isSending) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsSending(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch(`${window.location.origin}/api/ai/strategy-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: strategyId,
          user_message: userMessage,
          chat_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const aiData: AIStrategyRecommendation = await response.json();

      // Map AI trades to TradePreview format
      const mappedTrades: TradePreview[] = (aiData.trades || []).map(trade => ({
        type: trade.type,
        symbol: trade.symbol,
        quantity: trade.type === 'SELL' ? trade.quantity : 0, // For BUY, quantity will be calculated by API
        amount: trade.type === 'BUY' ? trade.amount : (trade.quantity * trade.price), // For SELL, amount = quantity * price
        price: trade.price,
        reason: trade.reason
      }));

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: aiData.message,
          trades: mappedTrades,
          impact: aiData.impact
        }
      ]);

    } catch (err) {
      console.error('Error sending message:', err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleApplyTrades(trades: TradePreview[]) {
    setPendingTrades(trades);
    setShowChat(false);
  }

  async function handleExecuteTrades() {
    if (pendingTrades.length === 0 || isExecuting) return;

    setIsExecuting(true);

    try {
      // Transform trades to match API expectations
      const apiTrades = pendingTrades.map(trade => ({
        type: trade.type,
        symbol: trade.symbol,
        quantity: trade.type === 'SELL' ? trade.quantity : undefined,
        amount: trade.type === 'BUY' ? trade.amount : undefined,
        price: trade.price,
        reason: trade.reason
      }));

      const response = await fetch(`${window.location.origin}/api/strategies/${strategyId}/execute-trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: apiTrades,
          reason: 'ai_recommendation'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute trades');
      }

      // Refresh strategy data
      await fetchStrategyData();
      setPendingTrades([]);
      
      // Show success message in chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Trades executed successfully! Your portfolio has been updated.`
      }]);

    } catch (err) {
      console.error('Error executing trades:', err);
      alert('Failed to execute trades. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="portfolios" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="portfolios" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                <p className="text-red-700 dark:text-red-300">{error || 'Strategy not found'}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);
  const totalReturn = strategy.total_return_pct || 0;
  const isPositiveReturn = totalReturn >= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="portfolios" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/portfolios"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolios
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {strategy.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  strategy.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : strategy.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                </span>
              </div>
              {strategy.description && (
                <p className="text-gray-600 dark:text-gray-400">{strategy.description}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Started {format(new Date(strategy.start_date), 'MMMM d, yyyy')}
                {strategy.is_paper_trading && <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">Paper Trading</span>}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Initial Capital</span>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${strategy.initial_capital.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Value</span>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Return</span>
              {isPositiveReturn ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              isPositiveReturn ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveReturn ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">P/L</span>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className={`text-2xl font-bold ${
              isPositiveReturn ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveReturn ? '+' : ''}${(totalValue - strategy.initial_capital).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* AI Chat Interface (Collapsible) */}
        {showChat && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                AI Strategy Assistant
              </h3>
            </div>
            
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.trades && msg.trades.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <p className="font-medium mb-2">Recommended Trades:</p>
                        <div className="space-y-2">
                          {msg.trades.map((trade, i) => (
                            <div key={i} className="text-sm bg-white dark:bg-gray-800 rounded p-2">
                              <span className={`font-medium ${trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.type}
                              </span> {
                                trade.type === 'BUY' 
                                  ? `${((trade.amount || 0) / (trade.price || 1)).toFixed(2)} shares of ${trade.symbol} ($${trade.amount?.toFixed(2) || 0})` 
                                  : `${trade.quantity?.toFixed(2) || 0} shares of ${trade.symbol}`
                              } @ ${trade.price?.toFixed(2) || 0}
                              {trade.reason && <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{trade.reason}</p>}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleApplyTrades(msg.trades!)}
                          className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors w-full"
                        >
                          Apply These Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask about your strategy, request changes, or get recommendations..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !userInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Trades Preview */}
        {pendingTrades.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Trades Ready to Execute
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Review and confirm the following trades
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingTrades([])}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {pendingTrades.map((trade, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded p-3 flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.type}
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {trade.type === 'BUY' 
                        ? `${((trade.amount || 0) / (trade.price || 1)).toFixed(2)} ${trade.symbol}`
                        : `${trade.quantity?.toFixed(2) || 0} ${trade.symbol}`
                      }
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      @ ${trade.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${trade.amount.toFixed(2)}
                    </p>
                    {trade.reason && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{trade.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleExecuteTrades}
              disabled={isExecuting}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Execute All Trades
                </>
              )}
            </button>
          </div>
        )}

        {/* Current Positions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Positions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P/L
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {positions.map((position) => {
                  const isProfitable = (position.unrealized_pnl || 0) >= 0;
                  const isOverweight = portfolio?.stocks?.find((s: any) => s.symbol === position.symbol)
                    ? (position.weight_pct || 0) > portfolio.stocks.find((s: any) => s.symbol === position.symbol).weight + 2
                    : false;
                  const isUnderweight = portfolio?.stocks?.find((s: any) => s.symbol === position.symbol)
                    ? (position.weight_pct || 0) < portfolio.stocks.find((s: any) => s.symbol === position.symbol).weight - 2
                    : false;

                  return (
                    <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{position.symbol}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                        {position.quantity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                        ${position.average_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                        ${position.current_price?.toFixed(2) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                        ${position.current_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={isProfitable ? 'text-green-600' : 'text-red-600'}>
                          {isProfitable ? '+' : ''}${position.unrealized_pnl?.toFixed(2) || '0.00'}
                        </div>
                        <div className={`text-xs ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfitable ? '+' : ''}{position.unrealized_pnl_pct?.toFixed(2) || '0.00'}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-900 dark:text-white">
                            {position.weight_pct?.toFixed(2) || '0.00'}%
                          </span>
                          {isOverweight && (
                            <span title="Overweight">
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            </span>
                          )}
                          {isUnderweight && (
                            <span title="Underweight">
                              <AlertTriangle className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                        {portfolio?.stocks?.find((s: any) => s.symbol === position.symbol) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Target: {portfolio.stocks.find((s: any) => s.symbol === position.symbol).weight}%
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.slice(0, 20).map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(tx.transaction_date), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === 'BUY' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : tx.type === 'SELL'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tx.symbol || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {tx.quantity?.toFixed(2) || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {tx.price ? `$${tx.price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

