'use client'

import { User } from '@supabase/supabase-js'
import PortfolioList from './PortfolioList'
import Navigation from './Navigation'

interface PortfoliosPageContentProps {
  user: User
}

export default function PortfoliosPageContent({ user }: PortfoliosPageContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PortfolioList />
      </main>
    </div>
  )
}