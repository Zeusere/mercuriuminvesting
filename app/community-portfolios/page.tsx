import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CommunityPortfoliosContent from '../../components/CommunityPortfoliosContent'

export default async function CommunityPortfoliosPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return <CommunityPortfoliosContent user={user} />
}
