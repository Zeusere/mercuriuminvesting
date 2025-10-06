import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyzeStrategyContent from '@/components/ai-investor/AnalyzeStrategyContent'

export default async function AnalyzeStrategyPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <AnalyzeStrategyContent user={user} />
}

