import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StockRoomChat from '@/components/stock-rooms/StockRoomChat';

export default async function StockRoomPage({
  params,
}: {
  params: { symbol: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const symbol = params.symbol.toUpperCase();

  return <StockRoomChat user={user} symbol={symbol} />;
}

