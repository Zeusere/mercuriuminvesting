import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BrokerOrdersContent from '@/components/ai-investor/BrokerOrdersContent'

export default async function BrokerOrdersPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <BrokerOrdersContent user={user} />
}

