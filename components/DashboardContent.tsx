'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { TrendingUp, Plus, Briefcase, Newspaper, Users, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Navigation from './Navigation'
import Link from 'next/link'

interface DashboardContentProps {
  user: User
}

interface Gainer {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface Loser {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface NewsArticle {
  id: string
  headline: string
  summary: string
  author: string
  created_at: string
  updated_at: string
  url: string
  symbols: string[]
  source: string
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [activeStrategies, setActiveStrategies] = useState<any[]>([])
  const [gainers, setGainers] = useState<Gainer[]>([])
  const [losers, setLosers] = useState<Loser[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [isLoadingGainers, setIsLoadingGainers] = useState(true)
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [marketOpen, setMarketOpen] = useState(false)

  useEffect(() => {
    fetchActiveStrategies()
    fetchGainers()
    fetchNews()
  }, [])

  const fetchActiveStrategies = async () => {
    try {
      const response = await fetch('/api/strategies?status=active')
      if (response.ok) {
        const data = await response.json()
        setActiveStrategies(data.strategies || [])
      }
    } catch (error) {
      console.error('Error fetching active strategies:', error)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const fetchGainers = async () => {
    try {
      const response = await fetch('/api/stocks/gainers')
      if (response.ok) {
        const data = await response.json()
        setGainers(data.gainers || [])
        setLosers(data.losers || [])
        setMarketOpen(data.marketOpen || false)
      } else {
        console.error('Failed to fetch gainers:', response.status)
        setGainers([])
        setLosers([])
      }
    } catch (error) {
      console.error('Error fetching gainers:', error)
      setGainers([])
      setLosers([])
    } finally {
      setIsLoadingGainers(false)
    }
  }

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news')
      if (response.ok) {
        const data = await response.json()
        setNews(data.news || [])
      } else {
        console.error('Failed to fetch news:', response.status)
        setNews([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNews([])
    } finally {
      setIsLoadingNews(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}</h1>
          <p className="text-gray-600 dark:text-gray-400">Here&apos;s what&apos;s happening with your investments today</p>
        </div>

        {/* Removed My Main Strategy section per request */}

        {/* Active Strategies Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold">Active Strategies</h2>
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
          ) : activeStrategies.length === 0 ? (
            <div className="card text-center py-8">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-lg mb-2 font-semibold">No active strategies</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run a strategy from one of your portfolios to start tracking live performance
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStrategies.map((strategy) => {
                const totalReturn = strategy.total_return_pct || 0;
                const isPositive = totalReturn >= 0;
                return (
                  <Link
                    key={strategy.id}
                    href={`/strategies/${strategy.id}`}
                    className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-transparent hover:border-green-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{strategy.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        strategy.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {strategy.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Initial: ${strategy.initial_capital.toLocaleString()}</p>
                      <p>Current: ${(strategy.current_capital || strategy.initial_capital).toLocaleString()}</p>
                      <div className={`font-bold text-lg flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {isPositive ? '+' : ''}{totalReturn.toFixed(2)}%
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Started {new Date(strategy.start_date).toLocaleDateString()}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
            </div>

        {/* News & Gainers Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market News - Twitter Style Feed */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="text-primary-600" size={24} />
                <h2 className="text-2xl font-bold">Market News</h2>
              </div>
              
              {isLoadingNews ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-3">
                  {news.slice(0, 10).map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card hover:scale-102 transition-transform cursor-pointer bg-white dark:bg-gray-800 border-l-4 border-blue-500 block"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-base flex-1 pr-2">{article.headline}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="font-semibold">{article.author || article.source}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(article.created_at)}</span>
                        {article.symbols && article.symbols.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1">
                              {article.symbols.slice(0, 3).map((symbol) => (
                                <span
                                  key={symbol}
                                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium"
                                >
                                  {symbol}
                                </span>
                              ))}
                              {article.symbols.length > 3 && (
                                <span className="text-gray-400">+{article.symbols.length - 3}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </a>
                  ))}
                  <div className="card bg-blue-50 dark:bg-blue-900/20 text-center py-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Showing news for your favorite stocks and portfolio holdings
              </p>
            </div>
          </div>
              ) : (
                <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-center py-12">
                  <Newspaper size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
                  <p className="text-lg mb-2 font-semibold">No News Available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Add stocks to your favorites or create a portfolio to see personalized news
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/stocks" className="btn-outline px-4 py-2 text-sm">
                      Browse Stocks
                    </Link>
                    <Link href="/ai-investor/create-strategy" className="btn-primary px-4 py-2 text-sm">
                      Create Portfolio
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* The Gainers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={24} />
                  <h2 className="text-2xl font-bold">The Gainers</h2>
                </div>
                {!isLoadingGainers && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    marketOpen 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {marketOpen ? '● Market Open' : '● Market Closed'}
                  </span>
                )}
        </div>

              {isLoadingGainers ? (
          <div className="card">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
          </div>
              ) : gainers.length > 0 ? (
          <div className="card">
                  <div className="space-y-2">
                    {gainers.map((stock, index) => (
                      <Link
                        key={stock.symbol}
                        href={`/stocks?symbol=${stock.symbol}`}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:scale-102 transition-transform cursor-pointer border border-green-100 dark:border-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-base">{stock.symbol}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              ${stock.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                            <ArrowUpRight size={18} />
                            <span className="text-lg">{stock.changePercent.toFixed(2)}%</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            +${stock.change.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {marketOpen ? 'Live data from Alpaca Markets' : 'Data from last trading session'}
                    </p>
                  </div>
          </div>
              ) : (
                <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-center py-12">
                  <TrendingUp size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
                  <p className="text-lg mb-2 font-semibold">Market Data Unavailable</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {marketOpen 
                      ? 'Currently updating market data. Please refresh in a moment.'
                      : 'Market is currently closed. Data will be available during trading hours.'}
                  </p>
              <button
                    onClick={fetchGainers}
                    className="btn-outline px-4 py-2 text-sm"
                  >
                    Refresh Data
              </button>
          </div>
              )}

              {/* The Losers */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="text-red-600" size={24} />
                    <h2 className="text-2xl font-bold">The Losers</h2>
          </div>
        </div>

                {isLoadingGainers ? (
                  <div className="card">
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
                ) : losers.length > 0 ? (
        <div className="card">
                    <div className="space-y-2">
                      {losers.map((stock, index) => (
                        <Link
                          key={stock.symbol}
                          href={`/stocks?symbol=${stock.symbol}`}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg hover:scale-102 transition-transform cursor-pointer border border-red-100 dark:border-red-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
            </div>
            <div>
                              <p className="font-bold text-base">{stock.symbol}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                ${stock.price.toFixed(2)}
              </p>
            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                              <ArrowDownRight size={18} />
                              <span className="text-lg">{stock.changePercent.toFixed(2)}%</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              ${stock.change.toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {marketOpen ? 'Live data from Alpaca Markets' : 'Data from last trading session'}
                      </p>
          </div>
        </div>
                ) : (
                  <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-center py-12">
                    <ArrowDownRight size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
                    <p className="text-lg mb-2 font-semibold">Market Data Unavailable</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {marketOpen 
                        ? 'Currently updating market data. Please refresh in a moment.'
                        : 'Market is currently closed. Data will be available during trading hours.'}
                    </p>
                    <button
                      onClick={fetchGainers}
                      className="btn-outline px-4 py-2 text-sm"
                    >
                      Refresh Data
            </button>
          </div>
                )}
          </div>
          </div>
          </div>
        </div>

        {/* Community Section - Coming Soon */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold">Community Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performers Placeholder */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="text-green-600" size={32} />
                <div>
                  <h3 className="text-lg font-bold">Top Performing Portfolios</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Growth Stocks 2024</p>
                    <p className="text-xs text-gray-500">by @investor_pro</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <ArrowUpRight size={16} />
                    <span>+24.5%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Tech Leaders</p>
                    <p className="text-xs text-gray-500">by @tech_investor</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <ArrowUpRight size={16} />
                    <span>+18.2%</span>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 italic">Coming Soon - Community Feature</p>
              </div>
          </div>
        </div>

            {/* Trending Stocks Placeholder */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-purple-600" size={32} />
                <div>
                  <h3 className="text-lg font-bold">Trending in Community</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Most Added Stocks</p>
                </div>
              </div>
          <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold">AAPL</p>
                    <p className="text-xs text-gray-500">Apple Inc.</p>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    234 portfolios
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold">MSFT</p>
                    <p className="text-xs text-gray-500">Microsoft</p>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    198 portfolios
                  </span>
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 italic">Coming Soon - Community Feature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

