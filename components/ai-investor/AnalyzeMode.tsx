'use client'

import { useState, useEffect } from 'react'
import { PortfolioAnalysis } from '@/types/ai-investor'
import { MultiPeriodBacktest } from '@/types/stocks'
import { TrendingUp, AlertTriangle, CheckCircle, Target, Briefcase, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import Link from 'next/link'

interface AnalyzeModeProps {
  analysis: PortfolioAnalysis | null
  performance: MultiPeriodBacktest | null
  onSelectPortfolio: (portfolio: SavedPortfolio) => void
  isAnalyzing: boolean
  selectedPortfolioId?: string | null
}

interface SavedPortfolio {
  id: string
  name: string
  stocks: any[]
  total_amount: number
  created_at: string
}

export default function AnalyzeMode({ analysis, performance, onSelectPortfolio, isAnalyzing, selectedPortfolioId }: AnalyzeModeProps) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios')
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data.portfolios || [])
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentBacktest = performance && period ? performance[period] : null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'increase':
        return <TrendingUp size={16} className="text-green-600" />
      case 'decrease':
        return <TrendingUp size={16} className="text-red-600 rotate-180" />
      case 'remove':
        return <AlertTriangle size={16} className="text-red-600" />
      case 'add':
        return <CheckCircle size={16} className="text-green-600" />
      default:
        return <Target size={16} className="text-blue-600" />
    }
  }

  if (!analysis && !performance) {
    return (
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase size={24} className="text-primary-600" />
            Select a Portfolio to Analyze
          </h3>
          
          {isLoading || isAnalyzing ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-primary-600 mb-3" size={32} />
              <p className="text-gray-600 dark:text-gray-400">
                {isAnalyzing ? 'Analyzing portfolio...' : 'Loading portfolios...'}
              </p>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any portfolios yet
              </p>
              <Link href="/ai-investor/create-strategy" className="btn-primary px-6 py-2">
                Create Your First Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((portfolio) => (
                <button
                  key={portfolio.id}
                  onClick={() => onSelectPortfolio(portfolio)}
                  className={`p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border-2 transition-all cursor-pointer text-left ${
                    selectedPortfolioId === portfolio.id
                      ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-700'
                      : 'border-transparent hover:border-primary-500 hover:scale-105'
                  }`}
                >
                  <h4 className="font-bold text-lg mb-2">{portfolio.name}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <p>{portfolio.stocks.length} stocks</p>
                    <p className="font-semibold text-lg">${portfolio.total_amount.toLocaleString()}</p>
                    <p className="text-xs">{new Date(portfolio.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {portfolio.stocks.slice(0, 4).map((stock: any) => (
                      <span
                        key={stock.symbol}
                        className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium"
                      >
                        {stock.symbol}
                      </span>
                    ))}
                    {portfolio.stocks.length > 4 && (
                      <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
                        +{portfolio.stocks.length - 4}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      Click to analyze →
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold mb-2">💡 How to Use</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Click on any portfolio above to analyze it</li>
            <li>• View performance charts, metrics, and AI insights</li>
            <li>• Get recommendations on diversification, risk, and optimization</li>
            <li>• Ask follow-up questions in the chat for deeper analysis</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      {performance && currentBacktest && currentBacktest.historical_values && currentBacktest.historical_values.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Portfolio Performance</h3>
            
            {/* Period selector */}
            <div className="flex gap-1">
              {['1M', '3M', 'YTD', '1Y', '3Y', '5Y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  disabled={!performance?.[p as keyof MultiPeriodBacktest]}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : performance?.[p as keyof MultiPeriodBacktest]
                      ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={currentBacktest.historical_values}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={(currentBacktest.total_return || 0) >= 0 ? '#10B981' : '#EF4444'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className={`p-3 rounded-lg ${
              (currentBacktest.total_return || 0) >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Return</p>
              <p className={`text-xl font-bold ${
                (currentBacktest.total_return || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(currentBacktest.total_return || 0) >= 0 ? '+' : ''}{(currentBacktest.total_return || 0).toFixed(2)}%
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Final Value</p>
              <p className="text-xl font-bold">${(currentBacktest.final_value || 0).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volatility</p>
              <p className="text-xl font-bold">{(currentBacktest.volatility || 0).toFixed(2)}%</p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sharpe Ratio</p>
              <p className="text-xl font-bold">{(currentBacktest.sharpe_ratio || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score */}
      {analysis && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">{analysis.portfolio_name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Analysis</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{analysis.overall_score}/10</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Overall Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {analysis && (
        <>
          <div className="card">
            <h3 className="text-xl font-bold mb-3">Analysis Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysis.analysis}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Level</p>
                <p className="font-semibold">{analysis.risk_level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Diversification</p>
                <p className="font-semibold">{analysis.diversification_score}/10</p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={24} />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700 dark:text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={24} />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">⚠</span>
                <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="text-blue-600" size={24} />
            Recommendations
          </h3>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionIcon(rec.action)}
                    <span className="font-bold text-lg">{rec.symbol}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {rec.action}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.reason}</p>
                {rec.current_weight !== undefined && rec.suggested_weight !== undefined && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Current: <span className="font-semibold">{rec.current_weight.toFixed(1)}%</span>
                    </span>
                    <span className="text-primary-600">→</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Suggested: <span className="font-semibold">{rec.suggested_weight.toFixed(1)}%</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
