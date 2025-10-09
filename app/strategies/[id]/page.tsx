import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ActiveStrategyViewer from '../../../components/ActiveStrategyViewer';

export default async function StrategyPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return <ActiveStrategyViewer user={user} strategyId={params.id} />;
}

