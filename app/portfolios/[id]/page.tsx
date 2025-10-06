import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortfolioViewer from '@/components/PortfolioViewer'

export default async function PortfolioViewPage({
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

  return <PortfolioViewer user={user} portfolioId={portfolioId} />
}

