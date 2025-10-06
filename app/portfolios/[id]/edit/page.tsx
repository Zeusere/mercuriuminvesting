import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditPortfolioContent from '@/components/EditPortfolioContent'

export default async function PortfolioEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const portfolioId = params.id

  // Fetch the portfolio
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', portfolioId)
    .eq('user_id', user.id) // Only owner can edit
    .single()

  if (error || !portfolio) {
    redirect('/portfolios')
  }

  return <EditPortfolioContent user={user} portfolio={portfolio} />
}

