'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, TrendingUp, BarChart3, AlertTriangle, Save, FolderOpen } from 'lucide-react'
import { PortfolioStock, SearchResult, BacktestResult, MultiPeriodBacktest } from '@/types/stocks'
import StockSearch from './StockSearch'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface SavedPortfolio {
  id: string
  name: string
  stocks: PortfolioStock[]
  total_amount: number
  created_at: string
}

interface PortfolioBuilderProps {
  onSave?: (portfolio: { name: string; stocks: PortfolioStock[]; totalAmount: number }) => void
  showSavedPortfolios?: boolean
}

export default function PortfolioBuilder({ onSave, showSavedPortfolios = true }: PortfolioBuilderProps) {
  const [portfolioName, setPortfolioName] = useState('')
  const [stocks, setStocks] = useState<PortfolioStock[]>([])
  const [totalAmount, setTotalAmount] = useState(10000)
  const [period, setPeriod] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')
  const [allBacktests, setAllBacktests] = useState<MultiPeriodBacktest | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([])
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)
  const [showNewPortfolioForm, setShowNewPortfolioForm] = useState(false)

  // Cargar carteras guardadas al montar
  useEffect(() => {
    fetchSavedPortfolios()
  }, [])

  // Escuchar eventos de la AI para añadir stocks
  useEffect(() => {
    const handleAIAddStocks = (event: any) => {
      const { stocks: aiStocks } = event.detail
      if (aiStocks && aiStocks.length > 0) {
        // Añadir los stocks de la AI al builder
        setStocks(aiStocks)
        setShowNewPortfolioForm(true)
        setAllBacktests(null)
        setHasCalculated(false)
        
        // Scroll hacia el formulario
        setTimeout(() => {
          const formElement = document.getElementById('portfolio-form')
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }

    window.addEventListener('ai-add-stocks', handleAIAddStocks)
    return () => window.removeEventListener('ai-add-stocks', handleAIAddStocks)
  }, [])

  const fetchSavedPortfolios = async () => {
    setIsLoadingPortfolios(true)
    try {
      const response = await fetch('/api/portfolios')
      if (response.ok) {
        const data = await response.json()
        // El endpoint devuelve { portfolios: [...] }
        setSavedPortfolios(data.portfolios || data || [])
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  const loadPortfolio = (portfolio: SavedPortfolio) => {
    // Cargar datos de la cartera
    setPortfolioName(portfolio.name + ' (Copia)')
    setStocks(portfolio.stocks)
    setTotalAmount(portfolio.total_amount)
    setAllBacktests(null)
    setHasCalculated(false)
    setShowNewPortfolioForm(true)
    
    // Scroll hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('portfolio-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const createNewPortfolio = () => {
    // Resetear formulario
    setPortfolioName('')
    setStocks([])
    setTotalAmount(10000)
    setAllBacktests(null)
    setHasCalculated(false)
    setShowNewPortfolioForm(true)
    
    // Scroll hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('portfolio-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const deletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cartera "${portfolioName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/portfolios?id=${portfolioId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Cartera eliminada exitosamente')
        fetchSavedPortfolios()
      } else {
        alert('Error eliminando cartera')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      alert('Error eliminando cartera')
    }
  }

  const handleAddStock = (stock: SearchResult) => {
    // Verificar si ya existe
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
    setAllBacktests(null) // Reset backtest cuando cambian las acciones
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
    // NO resetear backtest al cambiar pesos
  }

  const distributeEqually = () => {
    const equalWeight = 100 / stocks.length
    setStocks(stocks.map(s => ({ ...s, weight: equalWeight })))
    // NO resetear backtest al distribuir equitativamente
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
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolioName,
          stocks,
          total_amount: totalAmount,
        }),
      })

      if (response.ok) {
        alert('Cartera guardada exitosamente')
        if (onSave) {
          onSave({ name: portfolioName, stocks, totalAmount })
        }
        // Recargar lista de carteras
        fetchSavedPortfolios()
        // Reset
        setPortfolioName('')
        setStocks([])
        setAllBacktests(null)
        setHasCalculated(false)
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

  // Obtener el backtest del período actual
  const currentBacktest = allBacktests ? allBacktests[period] : null

  return (
    <div className="space-y-6">
      {/* Carteras Guardadas */}
      {showSavedPortfolios && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FolderOpen size={24} className="text-primary-600" />
              <h2 className="text-2xl font-bold">Mis Carteras</h2>
            </div>
            <button
              onClick={createNewPortfolio}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Cartera
            </button>
          </div>
          
        {isLoadingPortfolios ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
          </div>
        ) : savedPortfolios.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No tienes carteras guardadas</p>
            <p className="text-sm">Haz clic en &quot;Nueva Cartera&quot; para crear tu primera cartera</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPortfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="relative p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border-2 border-transparent hover:border-primary-500 transition-all group"
                >
                  {/* Botón eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePortfolio(portfolio.id, portfolio.name)
                    }}
                    className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar cartera"
                  >
                    <X size={18} />
                  </button>

                  <button
                    onClick={() => loadPortfolio(portfolio)}
                    className="w-full text-left"
                  >
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary-600 transition-colors pr-8">
                      {portfolio.name}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{portfolio.stocks.length} acciones</p>
                      <p className="font-semibold">${portfolio.total_amount.toLocaleString()}</p>
                      <p className="text-xs">{new Date(portfolio.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 mb-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Composición:</p>
                      {portfolio.stocks.map((stock) => (
                        <div key={stock.symbol} className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{stock.symbol}</span>
                          <span className="text-gray-600 dark:text-gray-400">{stock.weight.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                        Click para cargar y simular →
                      </p>
                    </div>
                  </button>
                </div>
              ))}
          </div>
        )}
        </div>
      )}

      {/* Configuración de cartera - Solo visible cuando se activa o cuando no se muestran portfolios guardados */}
      {(showNewPortfolioForm || !showSavedPortfolios) && (
        <div id="portfolio-form" className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {portfolioName.includes('(Copia)') ? 'Editar Cartera' : 'Crear Nueva Cartera'}
            </h2>
            <button
              onClick={() => {
                setShowNewPortfolioForm(false)
                setPortfolioName('')
                setStocks([])
                setAllBacktests(null)
                setHasCalculated(false)
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Cartera
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
      )}

      {/* Resultados del Backtest */}
      {currentBacktest && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              Simulación de Rendimiento ({currentBacktest.period_label})
            </h2>
            
            {/* Selector de período - movido aquí */}
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
