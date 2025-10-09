'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, FolderOpen, Trash2, Briefcase, Globe, Lock, TrendingUp, Star } from 'lucide-react'
import { PortfolioStock } from '@/types/stocks'

interface SavedPortfolio {
  id: string
  name: string
  stocks: PortfolioStock[]
  total_amount: number
  created_at: string
  is_public: boolean
}

interface ActiveStrategyListItem {
  id: string
  name: string
  start_date: string
  initial_capital: number
  current_capital: number | null
  total_return_pct: number | null
  status: 'active' | 'paused' | 'closed'
  is_main?: boolean
}

export default function PortfolioList() {
  const router = useRouter()
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([])
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)
  const [strategies, setStrategies] = useState<ActiveStrategyListItem[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)

  useEffect(() => {
    fetchSavedPortfolios()
    fetchStrategies()
  }, [])

  const fetchSavedPortfolios = async () => {
    setIsLoadingPortfolios(true)
    try {
      const response = await fetch('/api/portfolios')
      if (response.ok) {
        const data = await response.json()
        const portfolios = data.portfolios || data || []
        setSavedPortfolios(portfolios)
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  const fetchStrategies = async () => {
    setIsLoadingStrategies(true)
    try {
      const res = await fetch('/api/strategies?status=active')
      if (res.ok) {
        const data = await res.json()
        setStrategies(data.strategies || [])
      }
    } catch (e) {
      console.error('Error fetching strategies:', e)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const setMainStrategy = async (strategyId: string) => {
    try {
      const res = await fetch('/api/strategies/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id: strategyId })
      })
      if (res.ok) {
        // Update local list
        setStrategies(prev => prev.map(s => ({ ...s, is_main: s.id === strategyId })))
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to set main strategy')
      }
    } catch (e) {
      console.error('Error setting main strategy:', e)
    }
  }

  const deletePortfolio = async (e: React.MouseEvent, portfolioId: string, portfolioName: string) => {
    e.preventDefault() // Evitar navegación
    e.stopPropagation() // Evitar que el click se propague al Link
    
    if (!confirm(`¿Estás seguro de eliminar la cartera "${portfolioName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/portfolios?id=${portfolioId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchSavedPortfolios()
      } else {
        alert('Error eliminando cartera')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      alert('Error eliminando cartera')
    }
  }

  const togglePublicStatus = async (e: React.MouseEvent, portfolioId: string, currentStatus: boolean) => {
    e.preventDefault() // Evitar navegación
    e.stopPropagation() // Evitar que el click se propague al Link

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/public`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !currentStatus }),
      })

      if (response.ok) {
        // Update local state optimistically
        setSavedPortfolios(
          savedPortfolios.map((p) =>
            p.id === portfolioId ? { ...p, is_public: !currentStatus } : p
          )
        )
      } else {
        alert('Error updating portfolio visibility')
      }
    } catch (error) {
      console.error('Error toggling public status:', error)
      alert('Error updating portfolio visibility')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="text-primary-600" size={28} />
          <h1 className="text-3xl font-bold">My Portfolios</h1>
        </div>
        <Link
          href="/ai-investor/create-strategy"
          className="btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus size={20} />
          New Portfolio
        </Link>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400">
        Manage and track your investment portfolios
      </p>
          
      {isLoadingPortfolios ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : savedPortfolios.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
          <p className="text-lg mb-2 font-semibold">No portfolios yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create your first portfolio to start tracking your investments
          </p>
          <Link href="/ai-investor/create-strategy" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Create Portfolio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedPortfolios.map((portfolio) => (
            <Link
              key={portfolio.id}
              href={`/portfolios/${portfolio.id}`}
              className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-2 border-transparent hover:border-primary-500 relative group"
            >
              {/* Action buttons - appear on hover */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {/* Public/Private toggle */}
                <button
                  onClick={(e) => togglePublicStatus(e, portfolio.id, portfolio.is_public)}
                  className={`p-2 rounded-lg transition-all shadow-sm ${
                    portfolio.is_public
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={portfolio.is_public ? 'Public - Click to make private' : 'Private - Click to make public'}
                >
                  {portfolio.is_public ? <Globe size={16} /> : <Lock size={16} />}
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => deletePortfolio(e, portfolio.id, portfolio.name)}
                  className="p-2 bg-white dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm"
                  title="Delete portfolio"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Portfolio name with status badge */}
              <div className="flex items-start justify-between mb-2 pr-20">
                <h3 className="font-bold text-lg">{portfolio.name}</h3>
                {portfolio.is_public && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <Globe size={12} />
                    Public
                  </span>
                )}
              </div>
              
              {/* Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{portfolio.stocks.length} stocks</span>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">
                    ${portfolio.total_amount.toLocaleString()}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(portfolio.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              
              {/* Stock tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {portfolio.stocks.slice(0, 5).map((stock) => (
                  <span
                    key={stock.symbol}
                    className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium"
                  >
                    {stock.symbol} {stock.weight.toFixed(0)}%
                  </span>
                ))}
                {portfolio.stocks.length > 5 && (
                  <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
                    +{portfolio.stocks.length - 5} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Strategies Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mt-6 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={20} />
            <h2 className="text-xl font-bold">My Strategies</h2>
          </div>
        </div>

        {isLoadingStrategies ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : strategies.length === 0 ? (
          <div className="card text-center py-8">
            <TrendingUp size={36} className="mx-auto mb-2 opacity-50 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No active strategies yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((s) => {
              const ret = s.total_return_pct || 0
              const isPos = ret >= 0
              return (
                <div key={s.id} className="card bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-transparent hover:border-green-500 transition-colors relative">
                  {/* Main toggle */}
                  <button
                    onClick={() => setMainStrategy(s.id)}
                    title={s.is_main ? 'Main strategy' : 'Set as main'}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${s.is_main ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    <Star size={16} className={s.is_main ? 'fill-current' : ''} />
                  </button>

                  <Link href={`/strategies/${s.id}`} className="block">
                    <h3 className="font-bold text-lg mb-1 pr-10">{s.name}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Initial: ${s.initial_capital.toLocaleString()}</p>
                      <p>Current: ${(s.current_capital || s.initial_capital).toLocaleString()}</p>
                      <div className={`font-bold ${isPos ? 'text-green-600' : 'text-red-600'}`}>{isPos ? '+' : ''}{ret.toFixed(2)}%</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Started {new Date(s.start_date).toLocaleDateString()}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
