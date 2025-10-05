import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AIInvestorContent from '../../components/AIInvestorContent'

export default async function AIInvestorPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <AIInvestorContent user={session.user} />
}
