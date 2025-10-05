'use client'

import { User } from '@supabase/supabase-js'
import { Newspaper, BookOpen, TrendingUp } from 'lucide-react'
import Navigation from './Navigation'

interface BlogContentProps {
  user: User
}

export default function BlogContent({ user }: BlogContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="stocks" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold">Investment Blog</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Learn investment strategies, market analysis, and financial tips
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-center py-16">
          <Newspaper size={64} className="mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold mb-3">Coming Soon</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We&apos;re preparing high-quality content to help you become a better investor. Stay tuned for articles, guides, and market analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <BookOpen className="mx-auto mb-3 text-purple-500" size={32} />
              <h3 className="font-bold mb-2">Investment Guides</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn the basics and advanced strategies
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <TrendingUp className="mx-auto mb-3 text-green-500" size={32} />
              <h3 className="font-bold mb-2">Market Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Weekly market insights and trends
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <Newspaper className="mx-auto mb-3 text-blue-500" size={32} />
              <h3 className="font-bold mb-2">News & Updates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stay up to date with market news
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
