'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader2, Building2, Globe, DollarSign, BarChart3, Star } from 'lucide-react'
import { StockQuote, StockProfile, StockMetrics } from '@/types/stocks'
import StockChart from './StockChart'

interface StockDetailProps {
  symbol: string
}

export default function StockDetail({ symbol }: StockDetailProps) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [profile, setProfile] = useState<StockProfile | null>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y')

  useEffect(() => {
    fetchStockData()
    checkIfFavorite()
  }, [symbol])

  const fetchStockData = async () => {
    setIsLoading(true)
    try {
      // Fetch quote, profile, and metrics in parallel
      const [quoteRes, profileRes, metricsRes] = await Promise.all([
        fetch(`/api/stocks/quote?symbol=${symbol}`),
        fetch(`/api/stocks/profile?symbol=${symbol}`),
        fetch(`/api/stocks/metrics?symbol=${symbol}`)
      ])

      if (quoteRes.ok) setQuote(await quoteRes.json())
      if (profileRes.ok) setProfile(await profileRes.json())
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData.metric)
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkIfFavorite = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        const favorites = data.favorites || []
        setIsFavorite(favorites.some((f: any) => f.symbol === symbol))
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    if (isTogglingFavorite) return
    
    setIsTogglingFavorite(true)
    try {
      if (isFavorite) {
        // Eliminar de favoritos
        const response = await fetch(`/api/favorites?symbol=${symbol}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsFavorite(false)
        }
      } else {
        // Añadir a favoritos
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol,
            name: profile?.name || symbol,
          }),
        })
        if (response.ok) {
          setIsFavorite(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </div>
    )
  }

  if (!quote || !profile) {
    return (
      <div className="card">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No se pudieron cargar los datos de {symbol}
        </p>
      </div>
    )
  }

  const isPositive = quote.dp >= 0

  return (
    <div className="space-y-6">
      {/* Header con precio actual */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{symbol}</h1>
              {profile.logo && (
                <img src={profile.logo} alt={profile.name} className="w-10 h-10 rounded" />
              )}
              <button
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className={`p-2 rounded-lg transition-all ${
                  isFavorite
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
              >
                <Star
                  size={20}
                  className={isFavorite ? 'fill-current' : ''}
                />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{profile.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {profile.exchange} • {profile.finnhubIndustry}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-4xl font-bold">${quote.c.toFixed(2)}</p>
            <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span className="text-xl font-semibold">
                {isPositive ? '+' : ''}{quote.d.toFixed(2)} ({isPositive ? '+' : ''}{quote.dp.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Apertura</p>
            <p className="text-lg font-semibold">${quote.o.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Máximo</p>
            <p className="text-lg font-semibold">${quote.h.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mínimo</p>
            <p className="text-lg font-semibold">${quote.l.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cierre Anterior</p>
            <p className="text-lg font-semibold">${quote.pc.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Histórico de Precios</h2>
          <div className="flex gap-2">
            {(['1M', '3M', '6M', '1Y', '5Y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <StockChart symbol={symbol} period={period} />
      </div>

      {/* Fundamentales */}
      {metrics && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Métricas Fundamentales</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.marketCapitalization && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-primary-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Market Cap</p>
                </div>
                <p className="text-lg font-semibold">
                  ${(metrics.marketCapitalization / 1000).toFixed(2)}B
                </p>
              </div>
            )}
            
            {metrics.peRatio && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={16} className="text-primary-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">P/E Ratio</p>
                </div>
                <p className="text-lg font-semibold">{metrics.peRatio.toFixed(2)}</p>
              </div>
            )}

            {metrics.beta && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-primary-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Beta</p>
                </div>
                <p className="text-lg font-semibold">{metrics.beta.toFixed(2)}</p>
              </div>
            )}

            {metrics['52WeekHigh'] && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">52W High</p>
                <p className="text-lg font-semibold">${metrics['52WeekHigh'].toFixed(2)}</p>
              </div>
            )}

            {metrics['52WeekLow'] && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">52W Low</p>
                <p className="text-lg font-semibold">${metrics['52WeekLow'].toFixed(2)}</p>
              </div>
            )}

            {metrics.dividendYield && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dividend Yield</p>
                <p className="text-lg font-semibold">{metrics.dividendYield.toFixed(2)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de la empresa */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Información de la Empresa</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 size={20} className="text-primary-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Industria</p>
              <p className="font-semibold">{profile.finnhubIndustry}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Globe size={20} className="text-primary-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">País</p>
              <p className="font-semibold">{profile.country}</p>
            </div>
          </div>

          {profile.weburl && (
            <div className="flex items-start gap-3">
              <Globe size={20} className="text-primary-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sitio web</p>
                <a 
                  href={profile.weburl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline font-semibold"
                >
                  {profile.weburl}
                </a>
              </div>
            </div>
          )}

          {profile.ipo && (
            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-primary-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">IPO</p>
                <p className="font-semibold">{profile.ipo}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
