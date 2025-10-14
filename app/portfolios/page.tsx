import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortfoliosPageContent from '../../components/PortfoliosPageContent'

export default async function PortfoliosPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return <PortfoliosPageContent user={user} />
}
