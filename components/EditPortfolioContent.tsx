'use client'

import { User } from '@supabase/supabase-js'
import PortfolioForm from './PortfolioForm'
import Navigation from './Navigation'
import { PortfolioStock } from '@/types/stocks'

interface EditPortfolioContentProps {
  user: User
  portfolio: {
    id: string
    name: string
    stocks: PortfolioStock[]
    total_amount: number
  }
}

export default function EditPortfolioContent({ user, portfolio }: EditPortfolioContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PortfolioForm initialPortfolio={portfolio} />
      </main>
    </div>
  )
}