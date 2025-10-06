import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateStrategyContent from '@/components/ai-investor/CreateStrategyContent'

export default async function CreateStrategyPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <CreateStrategyContent user={user} />
}

