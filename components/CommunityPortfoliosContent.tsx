'use client'

import { User } from '@supabase/supabase-js'
import { Users, Trophy, TrendingUp } from 'lucide-react'
import Navigation from './Navigation'

interface CommunityPortfoliosContentProps {
  user: User
}

export default function CommunityPortfoliosContent({ user }: CommunityPortfoliosContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Community Portfolios</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and learn from the best performing portfolios in the community
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-center py-16">
          <Trophy size={64} className="mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold mb-3">Coming Soon</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Soon you will be able to explore portfolios created by other users, see their performance, and learn from the best investment strategies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <TrendingUp className="mx-auto mb-3 text-green-500" size={32} />
              <h3 className="font-bold mb-2">Top Performers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See the highest returning portfolios
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <Users className="mx-auto mb-3 text-blue-500" size={32} />
              <h3 className="font-bold mb-2">Follow Investors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Follow and learn from expert investors
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <Trophy className="mx-auto mb-3 text-yellow-500" size={32} />
              <h3 className="font-bold mb-2">Leaderboards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compete in monthly challenges
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
