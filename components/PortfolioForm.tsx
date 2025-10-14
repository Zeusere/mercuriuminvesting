'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, TrendingUp, BarChart3, AlertTriangle, Save, ArrowLeft, MessageSquare } from 'lucide-react'
import { PortfolioStock, SearchResult, BacktestResult, MultiPeriodBacktest } from '@/types/stocks'
import StockSearch from './StockSearch'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import Link from 'next/link'

interface PortfolioFormProps {
  initialPortfolio?: {
    id: string
    name: string
    stocks: PortfolioStock[]
    total_amount: number
  }
  isChatOpen?: boolean
  setIsChatOpen?: (open: boolean) => void
}

export default function PortfolioForm({ initialPortfolio, isChatOpen, setIsChatOpen }: PortfolioFormProps) {
  const router = useRouter()
  const [portfolioName, setPortfolioName] = useState(initialPortfolio?.name || '')
  const [stocks, setStocks] = useState<PortfolioStock[]>(initialPortfolio?.stocks || [])
  const [totalAmount, setTotalAmount] = useState(initialPortfolio?.total_amount || 10000)
  const [period, setPeriod] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')
  const [allBacktests, setAllBacktests] = useState<MultiPeriodBacktest | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)

  // Cargar datos y calcular backtest automáticamente cuando hay initialPortfolio
  useEffect(() => {
    const autoCalculate = async () => {
      if (!initialPortfolio || initialPortfolio.stocks.length === 0) return
      
      const totalWeight = initialPortfolio.stocks.reduce((sum, s) => sum + s.weight, 0)
      const isValid = Math.abs(totalWeight - 100) < 0.01

      if (!isValid) return

      setIsCalculating(true)
      try {
        const response = await fetch('/api/portfolios/backtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stocks: initialPortfolio.stocks,
            totalAmount: initialPortfolio.total_amount,
          }),
        })

        if (response.ok) {
          const data: MultiPeriodBacktest = await response.json()
          setAllBacktests(data)
          setHasCalculated(true)
        }
      } catch (error) {
        console.error('Error calculating backtest:', error)
      } finally {
        setIsCalculating(false)
      }
    }

    if (initialPortfolio?.id) {
      const timer = setTimeout(() => {
        autoCalculate()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [initialPortfolio?.id])

  const handleAddStock = (stock: SearchResult) => {
    if (stocks.find(s => s.symbol === stock.symbol)) {
      alert('Esta acción ya está en la cartera')
      return
    }

    const newStock: PortfolioStock = {
      symbol: stock.symbol,
      name: stock.description,
      weight: 0,
    }

    setStocks([...stocks, newStock])
    setAllBacktests(null)
    setHasCalculated(false)
  }

  const handleRemoveStock = (symbol: string) => {
    setStocks(stocks.filter(s => s.symbol !== symbol))
    setAllBacktests(null)
    setHasCalculated(false)
  }

  const handleWeightChange = (symbol: string, weight: number) => {
    setStocks(stocks.map(s =>
      s.symbol === symbol ? { ...s, weight } : s
    ))
  }

  const distributeEqually = () => {
    const equalWeight = 100 / stocks.length
    setStocks(stocks.map(s => ({ ...s, weight: equalWeight })))
  }

  const totalWeight = stocks.reduce((sum, s) => sum + s.weight, 0)
  const isValidWeights = Math.abs(totalWeight - 100) < 0.01 && stocks.length > 0

  const calculateBacktest = async () => {
    if (!isValidWeights) {
      alert('Los pesos deben sumar 100%')
      return
    }

    setIsCalculating(true)
    try {
      const response = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks,
          totalAmount,
        }),
      })

      if (response.ok) {
        const data: MultiPeriodBacktest = await response.json()
        setAllBacktests(data)
        setHasCalculated(true)
      } else {
        const error = await response.json()
        alert(error.error || 'Error calculando backtest')
      }
    } catch (error) {
      console.error('Error calculating backtest:', error)
      alert('Error calculando backtest')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSave = async () => {
    if (!portfolioName.trim()) {
      alert('Por favor ingresa un nombre para la cartera')
      return
    }

    if (!isValidWeights) {
      alert('Los pesos deben sumar 100%')
      return
    }

    setIsSaving(true)
    try {
      const method = initialPortfolio ? 'PATCH' : 'POST'
      const body = initialPortfolio
        ? JSON.stringify({
            portfolioId: initialPortfolio.id,
            name: portfolioName,
            stocks,
            total_amount: totalAmount,
          })
        : JSON.stringify({
            name: portfolioName,
            stocks,
            total_amount: totalAmount,
          })

      const response = await fetch('/api/portfolios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (response.ok) {
        alert(initialPortfolio ? 'Cartera actualizada exitosamente' : 'Cartera guardada exitosamente')
        router.push('/portfolios')
      } else {
        alert('Error guardando cartera')
      }
    } catch (error) {
      console.error('Error saving portfolio:', error)
      alert('Error guardando cartera')
    } finally {
      setIsSaving(false)
    }
  }

  const currentBacktest = allBacktests ? allBacktests[period] : null

  return (
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
          <h1 className="text-3xl font-bold">
            {initialPortfolio ? 'Editar Cartera' : 'Crear Nueva Cartera'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {initialPortfolio 
              ? 'Modifica tu cartera y visualiza su rendimiento actualizado' 
              : 'Configura tu cartera de inversión y simula su rendimiento histórico'
            }
          </p>
        </div>
        
        {/* AI Assistant Button - Only show if props are provided */}
        {isChatOpen !== undefined && setIsChatOpen && (
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            AI Assistant
          </button>
        )}
      </div>

      {/* Formulario */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Configuración</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Cartera</label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="Mi Cartera de Crecimiento"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cantidad a Invertir ($)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              min="100"
              step="100"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Búsqueda de acciones */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Agregar Acciones</label>
          <StockSearch
            onSelectStock={handleAddStock}
            placeholder="Buscar y agregar acciones..."
          />
        </div>

        {/* Lista de acciones */}
        {stocks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Acciones en Cartera ({stocks.length})
              </h3>
              <button
                onClick={distributeEqually}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Distribuir Equitativamente
              </button>
            </div>

            <div className="space-y-3">
              {stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={stock.weight}
                      onChange={(e) => handleWeightChange(stock.symbol, Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center"
                    />
                    <span className="text-sm font-medium">%</span>
                  </div>

                  <button
                    onClick={() => handleRemoveStock(stock.symbol)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de pesos */}
            <div className={`p-4 rounded-lg ${
              isValidWeights
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isValidWeights ? (
                    <TrendingUp className="text-green-600" size={20} />
                  ) : (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  )}
                  <span className="font-medium">
                    Total de Pesos: {totalWeight.toFixed(2)}%
                  </span>
                </div>
                {!isValidWeights && (
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Debe sumar 100%
                  </span>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={calculateBacktest}
                disabled={!isValidWeights || isCalculating}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Calculando...
                  </>
                ) : (
                  <>
                    <BarChart3 size={20} />
                    {hasCalculated ? 'Actualizar Simulación' : 'Simular Rendimiento'}
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={!isValidWeights || isSaving}
                className="flex-1 btn-outline py-3 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {initialPortfolio ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {initialPortfolio ? 'Actualizar Cartera' : 'Guardar Cartera'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {stocks.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Plus size={48} className="mx-auto mb-3 opacity-50" />
            <p>Busca y agrega acciones para comenzar a construir tu cartera</p>
          </div>
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
              {['1M', '3M', 'YTD', '1Y', '3Y', '5Y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  disabled={!allBacktests?.[p as keyof MultiPeriodBacktest]}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : allBacktests?.[p as keyof MultiPeriodBacktest]
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
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
  )
}
