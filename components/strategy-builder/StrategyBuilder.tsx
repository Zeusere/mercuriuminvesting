'use client'

import { useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { StrategyTree, StrategyBlock, BlockType } from '@/types/strategy-builder'
import StrategyCanvas from './StrategyCanvas'
import StrategySidebar from './StrategySidebar'
import BlockPalette from './BlockPalette'
import Navigation from '../Navigation'
import { Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface StrategyBuilderProps {
  user: User
  initialStrategy?: StrategyTree
  onSave?: (strategy: StrategyTree) => void
  onBacktest?: (strategy: StrategyTree) => void
}

interface BacktestData {
  '1M'?: BacktestPeriod
  '3M'?: BacktestPeriod
  'YTD'?: BacktestPeriod
  '1Y'?: BacktestPeriod
  '3Y'?: BacktestPeriod
  '5Y'?: BacktestPeriod
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

export default function StrategyBuilder({ 
  user,
  initialStrategy, 
  onSave, 
  onBacktest 
}: StrategyBuilderProps) {
  const rootId = uuidv4()
  const [strategy, setStrategy] = useState<StrategyTree>(
    initialStrategy || {
      rootBlockId: rootId,
      blocks: {
        [rootId]: {
          id: rootId,
          type: 'group',
          parentId: null,
          children: [],
          data: {
            group: { name: 'My Strategy' }
          }
        }
      }
    }
  )

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [history, setHistory] = useState<StrategyTree[]>([strategy])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [backtest, setBacktest] = useState<BacktestData | null>(null)
  const [isLoadingBacktest, setIsLoadingBacktest] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'>('1Y')

  const addBlock = useCallback((type: BlockType, parentId: string, conditionalBranch?: 'then' | 'else') => {
    const newBlock: StrategyBlock = {
      id: uuidv4(),
      type,
      parentId,
      children: [],
      data: getDefaultBlockData(type)
    }

    setStrategy(prev => {
      const newBlocks = { ...prev.blocks, [newBlock.id]: newBlock }
      const parent = newBlocks[parentId]
      
      if (parent) {
        // If adding to a conditional block, set the trueBlockId or falseBlockId
        if (parent.type === 'conditional' && conditionalBranch) {
          const existingConditional = parent.data.conditional
          const conditionalData = existingConditional ? {
            ...existingConditional,
            ...(conditionalBranch === 'then' 
              ? { trueBlockId: newBlock.id }
              : { falseBlockId: newBlock.id })
          } : {
            condition: {
              leftOperand: { type: 'technical' as const, indicator: 'ema' as any, period: 20 },
              operator: 'greater_than' as const,
              rightOperand: { type: 'indicator' as const, indicator: 'ema' as any, period: 50 }
            },
            ...(conditionalBranch === 'then' 
              ? { trueBlockId: newBlock.id }
              : { falseBlockId: newBlock.id })
          }
          
          newBlocks[parentId] = {
            ...parent,
            data: {
              ...parent.data,
              conditional: conditionalData
            }
          }
        } else {
          // Regular child addition
          newBlocks[parentId] = {
            ...parent,
            children: [...parent.children, newBlock.id]
          }
        }
      }
      
      return {
        ...prev,
        blocks: newBlocks
      }
    })

    // Add to history
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(strategy)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }, [strategy, historyIndex])

  const updateBlock = useCallback((blockId: string, updates: Partial<StrategyBlock>) => {
    setStrategy(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId],
          ...updates
        }
      }
    }))
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    setStrategy(prev => {
      const newBlocks = { ...prev.blocks }
      const block = newBlocks[blockId]
      
      // Remove from parent's children
      if (block.parentId) {
        const parent = newBlocks[block.parentId]
        if (parent) {
          newBlocks[block.parentId] = {
            ...parent,
            children: parent.children.filter(id => id !== blockId)
          }
        }
      }

      // Delete all children recursively
      const deleteRecursive = (id: string) => {
        const child = newBlocks[id]
        if (child) {
          child.children.forEach(childId => deleteRecursive(childId))
          delete newBlocks[id]
        }
      }
      deleteRecursive(blockId)

      return {
        ...prev,
        blocks: newBlocks
      }
    })
  }, [])

  const handleSave = () => {
    if (onSave) {
      onSave(strategy)
    }
  }

  // Convert strategy tree to stocks format for backtest
  const convertStrategyToStocks = useCallback((strategyTree: StrategyTree): Array<{ symbol: string; weight: number; name?: string }> => {
    const stocks: Array<{ symbol: string; weight: number; name?: string }> = []
    
    const collectAssets = (blockId: string, parentWeight: number = 100): void => {
      const block = strategyTree.blocks[blockId]
      if (!block) return

      if (block.type === 'asset' && block.data.asset?.symbol) {
        stocks.push({
          symbol: block.data.asset.symbol,
          weight: parentWeight,
          name: block.data.asset.name
        })
      } else if (block.type === 'weight') {
        const weightData = block.data.weight
        let weightValue = parentWeight
        
        if (weightData?.type === 'specified' && weightData.value) {
          weightValue = weightData.value
        } else if (weightData?.type === 'equal' && block.children.length > 0) {
          weightValue = parentWeight / block.children.length
        }
        
        // Process children with the calculated weight
        block.children.forEach(childId => {
          collectAssets(childId, weightValue)
        })
      } else if (block.type === 'conditional') {
        const conditionalData = block.data.conditional
        if (conditionalData) {
          // For now, we'll use the THEN branch if available, else ELSE
          // In a full implementation, this would evaluate the condition
          const branchId = conditionalData.trueBlockId || conditionalData.falseBlockId
          if (branchId) {
            collectAssets(branchId, parentWeight)
          }
        }
      } else {
        // For other block types, process children with same weight
        block.children.forEach(childId => {
          collectAssets(childId, parentWeight)
        })
      }
    }

    collectAssets(strategyTree.rootBlockId)
    
    // Normalize weights to sum to 100
    const totalWeight = stocks.reduce((sum, s) => sum + s.weight, 0)
    if (totalWeight > 0) {
      return stocks.map(s => ({
        ...s,
        weight: (s.weight / totalWeight) * 100
      }))
    }
    
    return stocks
  }, [])

  const handleBacktest = async () => {
    setIsLoadingBacktest(true)
    try {
      const stocks = convertStrategyToStocks(strategy)
      
      if (stocks.length === 0) {
        alert('Please add at least one asset to your strategy before running a backtest.')
        setIsLoadingBacktest(false)
        return
      }

      const response = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: stocks,
          total_amount: 10000, // Default amount
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to run backtest')
      }

      const backtestData = await response.json()
      setBacktest(backtestData)
      
      // Scroll to backtest section
      setTimeout(() => {
        const backtestSection = document.getElementById('backtest-section')
        if (backtestSection) {
          backtestSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)

      if (onBacktest) {
        onBacktest(strategy)
      }
    } catch (error) {
      console.error('Error running backtest:', error)
      alert('Failed to run backtest. Please try again.')
    } finally {
      setIsLoadingBacktest(false)
    }
  }

  const selectedBlock = selectedBlockId ? strategy.blocks[selectedBlockId] : null
  const currentBacktest = backtest?.[selectedTimeframe] || null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />
      
      <div className={`flex flex-col ${currentBacktest ? 'h-auto' : 'h-[calc(100vh-73px)]'} bg-white dark:bg-gray-900`}>
        {/* Main Content */}
        <div className={`flex ${currentBacktest ? 'flex-1 min-h-[600px]' : 'flex-1'} overflow-hidden`}>
          {/* Left Sidebar - Block Palette */}
          <BlockPalette 
            onBlockSelect={(type) => {
              // This will be handled by the canvas when user clicks to add
              console.log('Block selected:', type)
            }}
            onSave={handleSave}
          />

          {/* Center - Canvas */}
          <div className="flex-1 overflow-hidden relative">
            <StrategyCanvas
              strategy={strategy}
              selectedBlockId={selectedBlockId}
              onBlockSelect={setSelectedBlockId}
              onBlockAdd={addBlock}
              onBlockUpdate={updateBlock}
              onBlockDelete={deleteBlock}
            />
          </div>

          {/* Right Sidebar - Block Details */}
          <StrategySidebar
            block={selectedBlock}
            strategy={strategy}
            onUpdate={(updates) => {
              if (selectedBlockId) {
                updateBlock(selectedBlockId, updates)
              }
            }}
            onBacktest={handleBacktest}
            isLoadingBacktest={isLoadingBacktest}
          />
        </div>
      </div>

      {/* Backtest Results Section */}
      {currentBacktest && (
        <div id="backtest-section" className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="container mx-auto px-6 py-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                          ? 'bg-primary-600 dark:bg-primary-500 text-white'
                          : backtest?.[p]
                          ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                          : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-500'
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${currentBacktest.initial_value.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Final</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${currentBacktest.final_value.toLocaleString()}</p>
                </div>

                <div className={`p-4 rounded-lg ${
                  currentBacktest.total_return >= 0
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retorno Total</p>
                  <p className={`text-2xl font-bold ${
                    currentBacktest.total_return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {currentBacktest.total_return >= 0 ? '+' : ''}{currentBacktest.total_return.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retorno Anualizado</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currentBacktest.annualized_return.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volatilidad</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentBacktest.volatility.toFixed(2)}%</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sharpe Ratio</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentBacktest.sharpe_ratio.toFixed(2)}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Drawdown</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    -{currentBacktest.max_drawdown.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfico de valor histórico */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Evolución del Valor</h3>
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
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Rendimiento Individual por Acción</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Acción</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Peso</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Precio Inicial</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Precio Final</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Rendimiento</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Contribución</th>
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
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{stock.symbol}</p>
                              {stock.name && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">
                            {stock.weight.toFixed(1)}%
                          </td>
                          <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">
                            ${stock.initial_price.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">
                            ${stock.final_price.toFixed(2)}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            stock.return_percent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stock.return_percent >= 0 ? '+' : ''}{stock.return_percent.toFixed(2)}%
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${
                            stock.contribution_to_portfolio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
          </div>
        </div>
      )}
    </div>
  )
}

function getDefaultBlockData(type: BlockType): StrategyBlock['data'] {
  switch (type) {
    case 'asset':
      return { asset: { symbol: '', name: '' } }
    case 'weight':
      return { weight: { type: 'specified', value: 0 } }
    case 'conditional':
      return {
        conditional: {
          condition: {
            leftOperand: { type: 'technical', indicator: 'ema', period: 20 },
            operator: 'greater_than',
            rightOperand: { type: 'indicator', indicator: 'ema', period: 50 }
          }
        }
      }
    case 'filter':
      return { filter: { criteria: [], limit: 10 } }
    case 'group':
      return { group: { name: 'New Group' } }
    default:
      return {}
  }
}

