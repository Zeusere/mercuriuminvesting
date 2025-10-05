'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { TrendingUp, Plus, Briefcase, Newspaper, Users, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Navigation from './Navigation'
import Link from 'next/link'
import { PortfolioStock } from '@/types/stocks'

interface DashboardContentProps {
  user: User
}

interface SavedPortfolio {
  id: string
  name: string
  stocks: PortfolioStock[]
  total_amount: number
  created_at: string
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

        {/* My Portfolios Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold">My Portfolios</h2>
            </div>
            <Link href="/portfolios/new" className="btn-primary px-4 py-2 flex items-center gap-2">
              <Plus size={20} />
              New Portfolio
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : portfolios.length === 0 ? (
            <div className="card text-center py-12">
              <Briefcase size={48} className="mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="text-lg mb-2 font-semibold">No portfolios yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create your first portfolio to start tracking your investments
              </p>
              <Link href="/portfolios/new" className="btn-primary inline-flex items-center gap-2">
                <Plus size={20} />
                Create Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolios/edit/${portfolio.id}`}
                  className="card hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-2 border-transparent hover:border-primary-500"
                >
                  <h3 className="font-bold text-lg mb-2">{portfolio.name}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>{portfolio.stocks.length} stocks</p>
                    <p className="font-semibold text-lg">${portfolio.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {portfolio.stocks.slice(0, 4).map((stock) => (
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
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio News Section - Coming Soon */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold">Market News</h2>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="text-center py-8">
              <Newspaper size={48} className="mx-auto mb-3 opacity-50 text-blue-500" />
              <p className="text-lg mb-2 font-semibold">Coming Soon</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized news about stocks in your portfolios
              </p>
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

