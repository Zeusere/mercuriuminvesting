import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortfoliosPageContent from '../../components/PortfoliosPageContent'

export default async function PortfoliosPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <PortfoliosPageContent user={session.user} />
}
