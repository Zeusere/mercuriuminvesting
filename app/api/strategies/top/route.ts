import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/strategies/top?limit=5 - Top strategies by monthly return for current month (user's own or public?)
// We'll compute for all active strategies (status=active) and start_date <= end of month
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '5', 10)
  try {
    const supabase = createServerSupabaseClient()

    // Get active strategies with current_capital and initial_capital
    const { data: strategies, error } = await supabase
      .from('active_strategies')
      .select('id, name, user_id, start_date, initial_capital, current_capital, total_return_pct')
      .eq('status', 'active')

    if (error) {
      console.error('Top strategies error:', error)
      return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // For simplicity, approximate monthly return using transactions since start of month would be ideal; here we use delta of positions values if available
    // As a proxy: compute return_pct_month = (current_capital - capital_at_start_month) / capital_at_start_month
    // Without historical snapshot, fall back to total_return_pct

    const ranked = (strategies || []).map((s: any) => {
      // proxy: use total_return_pct as placeholder; extend later with rebalances table snapshots
      const monthlyReturnPct = s.total_return_pct ?? 0
      return { ...s, monthlyReturnPct }
    }).sort((a, b) => (b.monthlyReturnPct - a.monthlyReturnPct)).slice(0, limit)

    return NextResponse.json({ strategies: ranked })
  } catch (e) {
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}


