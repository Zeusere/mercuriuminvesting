'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Navigation from './Navigation'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import Link from 'next/link'

interface Stock {
  symbol: string
  weight: number
  name?: string
}

interface Portfolio {
  id: string
  name: string
  stocks: Stock[]
  total_amount: number
  created_at: string
  is_public: boolean
  user_id: string
}

interface BacktestPeriod {
  period_label: string
  total_return: number
  annualized_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  initial_value: number
  final_value: number
  historical_values: Array<{ date: string; value: number }>
  stock_performance: Array<{
    symbol: string
    name?: string
    weight: number
    initial_price: number
    final_price: number
    return_percent: number
    contribution_to_portfolio: number
  }>
}

type BacktestData = {
  '1M'?: BacktestPeriod
  '3M'?: BacktestPeriod
  'YTD'?: BacktestPeriod
  '1Y'?: BacktestPeriod
  '3Y'?: BacktestPeriod
  '5Y'?: BacktestPeriod
}

interface PortfolioViewerProps {
  user: User
  portfolioId: string
}

export default function PortfolioViewer({ user, portfolioId }: PortfolioViewerProps) {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [backtest, setBacktest] = useState<BacktestData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')

  const isOwner = portfolio?.user_id === user.id

  useEffect(() => {
    fetchPortfolio()
  }, [portfolioId])

  const fetchPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch portfolio
      const response = await fetch(`/api/portfolios/${portfolioId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Portfolio not found')
          return
        }
        if (response.status === 403) {
          setError('This portfolio is private')
          return
        }
        throw new Error('Failed to fetch portfolio')
      }

      const portfolioData = await response.json()
      setPortfolio(portfolioData)

      // Fetch backtest
      const backtestResponse = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: portfolioData.stocks,
          total_amount: portfolioData.total_amount,
        }),
      })

      if (backtestResponse.ok) {
        const backtestData = await backtestResponse.json()
        setBacktest(backtestData)
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      setError('Failed to load portfolio')
    } finally {
      setIsLoading(false)
    }
  }

  const currentBacktest = backtest?.[selectedTimeframe] || null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="portfolios" />
        <main className="container mx-auto px-4 py-24">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} currentPage="portfolios" />
        <main className="container mx-auto px-4 py-24">
          <div className="card text-center py-12">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2">{error || 'Portfolio not found'}</h3>
            <button onClick={() => router.back()} className="btn-primary mt-4">
              Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="portfolios" />
      <main className="container mx-auto px-4 py-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link 
                  href="/portfolios"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <ArrowLeft size={20} />
                  Volver
                </Link>
              </div>
              <h1 className="text-3xl font-bold">{portfolio.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {portfolio.stocks.length} stocks • ${portfolio.total_amount.toLocaleString()} • 
                Created {new Date(portfolio.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            {isOwner && (
              <Link
                href={`/portfolios/${portfolioId}/edit`}
                className="btn-primary"
              >
                Edit Portfolio
              </Link>
            )}
          </div>

          {/* Resultados del Backtest */}
          {currentBacktest && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Simulación de Rendimiento ({currentBacktest.period_label})
                </h2>
                
                {/* Selector de período */}
                <div className="flex gap-2 flex-wrap">
                  {(['1M', '3M', 'YTD', '1Y', '3Y', '5Y'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedTimeframe(p)}
                      disabled={!backtest?.[p]}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                        selectedTimeframe === p
                          ? 'bg-primary-600 text-white'
                          : backtest?.[p]
                          ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inversión Inicial</p>
                  <p className="text-2xl font-bold">${currentBacktest.initial_value.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Final</p>
                  <p className="text-2xl font-bold">${currentBacktest.final_value.toLocaleString()}</p>
                </div>

                <div className={`p-4 rounded-lg ${
                  currentBacktest.total_return >= 0
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retorno Total</p>
                  <p className={`text-2xl font-bold ${
                    currentBacktest.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentBacktest.total_return >= 0 ? '+' : ''}{currentBacktest.total_return.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retorno Anualizado</p>
                  <p className="text-2xl font-bold">
                    {currentBacktest.annualized_return.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volatilidad</p>
                  <p className="text-xl font-bold">{currentBacktest.volatility.toFixed(2)}%</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sharpe Ratio</p>
                  <p className="text-xl font-bold">{currentBacktest.sharpe_ratio.toFixed(2)}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Drawdown</p>
                  <p className="text-xl font-bold text-red-600">
                    -{currentBacktest.max_drawdown.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfico de valor histórico */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Evolución del Valor</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={currentBacktest.historical_values}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']}
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

              {/* Desglose de Rendimiento por Acción */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Rendimiento Individual por Acción</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">Acción</th>
                        <th className="text-right py-3 px-4 font-semibold">Peso</th>
                        <th className="text-right py-3 px-4 font-semibold">Precio Inicial</th>
                        <th className="text-right py-3 px-4 font-semibold">Precio Final</th>
                        <th className="text-right py-3 px-4 font-semibold">Rendimiento</th>
                        <th className="text-right py-3 px-4 font-semibold">Contribución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBacktest.stock_performance.map((stock) => (
                        <tr 
                          key={stock.symbol}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold">{stock.symbol}</p>
                              {stock.name && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            {stock.weight.toFixed(1)}%
                          </td>
                          <td className="text-right py-3 px-4">
                            ${stock.initial_price.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4">
                            ${stock.final_price.toFixed(2)}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            stock.return_percent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stock.return_percent >= 0 ? '+' : ''}{stock.return_percent.toFixed(2)}%
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            stock.contribution_to_portfolio >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stock.contribution_to_portfolio >= 0 ? '+' : ''}{stock.contribution_to_portfolio.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Contribución:</strong> Representa cuánto aportó cada acción al rendimiento total del portfolio, 
                    considerando su peso. La suma de todas las contribuciones es igual al rendimiento total del portfolio.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

