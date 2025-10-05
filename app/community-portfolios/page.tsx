import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CommunityPortfoliosContent from '../../components/CommunityPortfoliosContent'

export default async function CommunityPortfoliosPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <CommunityPortfoliosContent user={session.user} />
}
