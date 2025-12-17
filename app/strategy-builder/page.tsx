'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import StrategyBuilder from '@/components/strategy-builder/StrategyBuilder'
import { StrategyTree } from '@/types/strategy-builder'
import { Loader2 } from 'lucide-react'

export default function StrategyBuilderPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleSave = async (strategy: StrategyTree) => {
    // TODO: Save strategy to database
    console.log('Saving strategy:', strategy)
  }

  const handleBacktest = async (strategy: StrategyTree) => {
    // Backtest is now handled internally in StrategyBuilder
    console.log('Backtest completed for:', strategy)
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary-600" size={48} />
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <StrategyBuilder
      user={user}
      onSave={handleSave}
      onBacktest={handleBacktest}
    />
  )
}

