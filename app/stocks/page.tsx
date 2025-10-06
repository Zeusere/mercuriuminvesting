import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StocksPageContent from '../../components/StocksPageContent'

interface StocksPageProps {
  searchParams: { symbol?: string }
}

export default async function StocksPage({ searchParams }: StocksPageProps) {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <StocksPageContent user={session.user} initialSymbol={searchParams.symbol} />
}
