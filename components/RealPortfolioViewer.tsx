'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Holding {
  symbol: string
  name: string
  total_quantity: number
  total_value: number
  total_cost_basis: number
  weighted_avg_price: number
  gain_loss: number
  gain_loss_percent: number
  weight_percent: number
  accounts: Array<{
    account_name: string
    quantity: number
    value: number
  }>
}

interface PortfolioSummary {
  total_holdings: number
  unique_securities: number
  total_value: number
  total_cost_basis: number
  total_gain_loss: number
  total_gain_loss_percent: number
  last_synced_at: string | null
}

interface RealPortfolioViewerProps {
  connectionId?: string
  onSync?: () => void
}

export default function RealPortfolioViewer({ connectionId, onSync }: RealPortfolioViewerProps) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHoldings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = connectionId 
        ? `/api/plaid/get-holdings?connection_id=${connectionId}`
        : '/api/plaid/get-holdings'
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to load holdings')
      }

      setHoldings(data.consolidated_holdings || [])
      setSummary(data.summary)
    } catch (err: any) {
      console.error('Error loading holdings:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!connectionId) {
      setError('No connection ID provided')
      return
    }

    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/plaid/sync-holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to sync holdings')
      }

      console.log('Sync completed:', data)
      
      // Recargar holdings
      await loadHoldings()
      
      if (onSync) {
        onSync()
      }
    } catch (err: any) {
      console.error('Error syncing:', err)
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadHoldings()
  }, [connectionId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Error</h3>
        </div>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={loadHoldings}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <PieChart className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Holdings Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your portfolio is empty or hasn't been synced yet.
        </p>
        {connectionId && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    )
  }

  const isPositive = (summary?.total_gain_loss || 0) >= 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100 text-sm font-medium">Total Value</span>
            <DollarSign size={20} className="text-purple-200" />
          </div>
          <p className="text-3xl font-bold">
            ${summary?.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gain/Loss */}
        <div className={`p-6 rounded-xl text-white shadow-lg ${
          isPositive 
            ? 'bg-gradient-to-br from-green-500 to-green-600' 
            : 'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-100' : 'text-red-100'}`}>
              Gain/Loss
            </span>
            {isPositive ? (
              <TrendingUp size={20} className="text-green-200" />
            ) : (
              <TrendingDown size={20} className="text-red-200" />
            )}
          </div>
          <p className="text-3xl font-bold">
            {isPositive ? '+' : ''}${summary?.total_gain_loss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm mt-1 opacity-90">
            {isPositive ? '+' : ''}{summary?.total_gain_loss_percent.toFixed(2)}%
          </p>
        </div>

        {/* Holdings Count */}
        <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm font-medium">Holdings</span>
            <PieChart size={20} className="text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{summary?.unique_securities}</p>
          <p className="text-sm mt-1 text-blue-100">
            {summary?.total_holdings} total positions
          </p>
        </div>

        {/* Last Sync */}
        <div className="p-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-100 text-sm font-medium">Last Sync</span>
            <Calendar size={20} className="text-gray-200" />
          </div>
          <p className="text-lg font-semibold">
            {summary?.last_synced_at 
              ? formatDistanceToNow(new Date(summary.last_synced_at), { addSuffix: true, locale: es })
              : 'Never'}
          </p>
          {connectionId && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="mt-2 flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </button>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio Holdings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gain/Loss
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {holdings.map((holding) => {
                const isGain = holding.gain_loss >= 0
                return (
                  <tr 
                    key={holding.symbol}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {holding.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {holding.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {holding.total_quantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      ${holding.weighted_avg_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">
                      ${holding.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`font-semibold ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isGain ? '+' : ''}${holding.gain_loss.toFixed(2)}
                      </div>
                      <div className={`text-xs ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isGain ? '+' : ''}{holding.gain_loss_percent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {holding.weight_percent.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

