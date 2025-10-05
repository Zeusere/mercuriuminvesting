import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import NewPortfolioContent from '@/components/NewPortfolioContent'

export default async function NewPortfolioPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <NewPortfolioContent user={session.user} />
}
