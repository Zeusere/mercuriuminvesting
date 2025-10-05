'use client'

import { User } from '@supabase/supabase-js'
import PortfolioForm from './PortfolioForm'
import Navigation from './Navigation'

interface NewPortfolioContentProps {
  user: User
}

export default function NewPortfolioContent({ user }: NewPortfolioContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PortfolioForm />
      </main>
    </div>
  )
}