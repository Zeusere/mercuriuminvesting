import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EditPortfolioContent from '../../../../components/EditPortfolioContent'

export default async function EditPortfolioPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch portfolio data
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !portfolio) {
    redirect('/portfolios')
  }

  return <EditPortfolioContent user={session.user} portfolio={portfolio} />
}
