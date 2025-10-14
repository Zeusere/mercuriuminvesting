import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StocksPageContent from '../../components/StocksPageContent'

interface StocksPageProps {
  searchParams: { symbol?: string }
}

export default async function StocksPage({ searchParams }: StocksPageProps) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return <StocksPageContent user={user} initialSymbol={searchParams.symbol} />
}
