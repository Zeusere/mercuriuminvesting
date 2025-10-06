'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, TrendingUp, AlertCircle, DollarSign, Edit2, Check, BarChart3, Loader2 } from 'lucide-react'
import { StockRecommendation, PortfolioSuggestion } from '@/types/ai-investor'
import { MultiPeriodBacktest } from '@/types/stocks'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface CreatePortfolioModeProps {
  suggestion: PortfolioSuggestion | null
  onRegenerate: () => void
  onPortfolioUpdate?: (updated: PortfolioSuggestion) => void
}

export default function CreatePortfolioMode({ suggestion, onRegenerate, onPortfolioUpdate }: CreatePortfolioModeProps) {
  const router = useRouter()
  const [stocks, setStocks] = useState<StockRecommendation[]>(suggestion?.stocks || [])
  const [totalAmount, setTotalAmount] = useState(suggestion?.total_amount || 10000)
  const [portfolioName, setPortfolioName] = useState('')
  const [editingWeight, setEditingWeight] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')
  const [allBacktests, setAllBacktests] = useState<MultiPeriodBacktest | null>(null)

  // Update stocks when suggestion changes
  useEffect(() => {
    if (suggestion?.stocks) {
      console.log('CreatePortfolioMode received stocks:', suggestion.stocks.length)
      setStocks(suggestion.stocks)
      setTotalAmount(suggestion.total_amount)
      
      // Auto-calculate backtest when portfolio is loaded
      if (suggestion.stocks.length > 0) {
        calculateBacktest(suggestion.stocks, suggestion.total_amount)
      }
    }
  }, [suggestion])

  const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0)
  const isValidWeights = Math.abs(totalWeight - 100) < 0.01

  const calculateBacktest = async (stocksToTest?: StockRecommendation[], amount?: number) => {
    const testStocks = stocksToTest || stocks
    const testAmount = amount || totalAmount

    if (testStocks.length === 0) return

    const totalW = testStocks.reduce((sum, s) => sum + s.weight, 0)
    if (Math.abs(totalW - 100) >= 0.01) return

    setIsRefreshing(true)
    try {
      const response = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: testStocks.map(s => ({ symbol: s.symbol, weight: s.weight })),
          totalAmount: testAmount,
        }),
      })

      if (response.ok) {
        const data: MultiPeriodBacktest = await response.json()
        setAllBacktests(data)
      }
    } catch (error) {
      console.error('Error calculating backtest:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    calculateBacktest()
  }

  const handleWeightChange = (symbol: string, newWeight: number) => {
    const updated = stocks.map(s => 
      s.symbol === symbol ? { ...s, weight: Math.max(0, Math.min(100, newWeight)) } : s
    )
    setStocks(updated)
    if (onPortfolioUpdate && suggestion) {
      onPortfolioUpdate({ ...suggestion, stocks: updated })
    }
  }

  const handleRemoveStock = (symbol: string) => {
    const updated = stocks.filter(s => s.symbol !== symbol)
    setStocks(updated)
    setAllBacktests(null)
    if (onPortfolioUpdate && suggestion) {
      onPortfolioUpdate({ ...suggestion, stocks: updated })
    }
  }

  const handleAmountChange = (newAmount: number) => {
    setTotalAmount(newAmount)
    setEditingAmount(false)
    if (onPortfolioUpdate && suggestion) {
      onPortfolioUpdate({ ...suggestion, total_amount: newAmount })
    }
  }

  const handleSavePortfolio = async () => {
    if (!portfolioName.trim()) {
      alert('Please enter a portfolio name')
      return
    }

    if (!isValidWeights) {
      alert('Total weights must equal 100%')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolioName,
          stocks: stocks.map(s => ({ symbol: s.symbol, weight: s.weight })),
          total_amount: totalAmount,
        }),
      })

      if (response.ok) {
        alert('Portfolio saved successfully!')
        router.push('/portfolios')
      } else {
        alert('Error saving portfolio')
      }
    } catch (error) {
      console.error('Error saving portfolio:', error)
      alert('Error saving portfolio')
    } finally {
      setIsSaving(false)
    }
  }

  const currentBacktest = allBacktests ? allBacktests[period] : null

  if (!suggestion) {
    return (
      <div className="text-center py-12">
        <TrendingUp size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
        <h3 className="text-xl font-bold mb-2">No Portfolio Suggestion Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start a conversation to get AI-powered portfolio recommendations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Section: Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart and Metrics - Takes 2/3 of space */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart */}
          {currentBacktest ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Performance ({currentBacktest.period_label})</h3>
                
                {/* Period selector in top right */}
                <div className="flex gap-1">
                  {['1M', '3M', 'YTD', '1Y', '3Y', '5Y'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      disabled={!allBacktests?.[p as keyof MultiPeriodBacktest]}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        period === p
                          ? 'bg-primary-600 text-white'
                          : allBacktests?.[p as keyof MultiPeriodBacktest]
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
                    stroke={currentBacktest.total_return >= 0 ? '#10B981' : '#EF4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card bg-gray-50 dark:bg-gray-800 text-center py-12">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRefreshing ? 'Calculating performance...' : 'Performance chart will appear here'}
              </p>
            </div>
          )}

          {/* Key Metrics */}
          {currentBacktest && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg ${
                currentBacktest.total_return >= 0
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Return</p>
                <p className={`text-xl font-bold ${
                  currentBacktest.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentBacktest.total_return >= 0 ? '+' : ''}{currentBacktest.total_return.toFixed(2)}%
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Final Value</p>
                <p className="text-xl font-bold">${currentBacktest.final_value.toLocaleString()}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volatility</p>
                <p className="text-xl font-bold">{currentBacktest.volatility.toFixed(2)}%</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sharpe Ratio</p>
                <p className="text-xl font-bold">{currentBacktest.sharpe_ratio.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Summary - Takes 1/3 of space */}
        <div className="lg:col-span-1">
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Portfolio Summary</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.risk_assessment}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Investment Amount - Editable */}
              <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Investment Amount</p>
                {editingAmount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="flex-1 px-2 py-1 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800"
                      step="1000"
                      min="100"
                    />
                    <button
                      onClick={() => handleAmountChange(totalAmount)}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-primary-600">${totalAmount.toLocaleString()}</p>
                    <button
                      onClick={() => setEditingAmount(true)}
                      className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Number of Stocks */}
              <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Positions</p>
                <p className="text-2xl font-bold">{stocks.length} stocks</p>
              </div>

              {/* Weight Validation */}
              <div className={`p-3 rounded-lg ${
                isValidWeights
                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Total Weights</span>
                  <span className={`text-lg font-bold ${isValidWeights ? 'text-green-600' : 'text-yellow-600'}`}>
                    {totalWeight.toFixed(1)}%
                  </span>
                </div>
                {!isValidWeights && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Must equal 100%</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Name */}
      <div className="card">
        <label className="block mb-2 font-semibold text-sm">Portfolio Name</label>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          placeholder="e.g., AI Growth Portfolio 2025"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSavePortfolio}
          disabled={!portfolioName.trim() || !isValidWeights || isSaving || stocks.length === 0}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Portfolio
            </>
          )}
        </button>

        <button
          onClick={onRegenerate}
          className="btn-outline px-6 py-2.5 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Ask AI to Adjust
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !isValidWeights}
          className="btn-outline px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Stock Positions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Stock Positions</h3>
          <span className={`text-sm font-semibold ${isValidWeights ? 'text-green-600' : 'text-red-600'}`}>
            Total: {totalWeight.toFixed(1)}%
          </span>
        </div>

        <div className="space-y-3">
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold">{stock.symbol}</h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{stock.reason}</p>
                  
                  {/* Metrics */}
                  {stock.metrics && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stock.metrics.performance_ytd !== undefined && (
                        <div className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Return: </span>
                          <span className={stock.metrics.performance_ytd >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {stock.metrics.performance_ytd >= 0 ? '+' : ''}{stock.metrics.performance_ytd.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {stock.metrics.price && (
                        <div className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Price: </span>
                          <span className="font-semibold">${stock.metrics.price.toFixed(2)}</span>
                        </div>
                      )}
                      {stock.metrics.volatility && (
                        <div className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Vol: </span>
                          <span className="font-semibold">{stock.metrics.volatility.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Weight Control */}
                <div className="flex items-center gap-2">
                  {editingWeight === stock.symbol ? (
                    <>
                      <input
                        type="number"
                        value={stock.weight}
                        onChange={(e) => handleWeightChange(stock.symbol, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <button
                        onClick={() => setEditingWeight(null)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      >
                        <Check size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">{stock.weight.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">
                          ${((totalAmount * stock.weight) / 100).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingWeight(stock.symbol)}
                        className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemoveStock(stock.symbol)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}