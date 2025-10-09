import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/strategies/[id] - Get strategy details with positions and transactions
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyId = params.id;

    // 1. Get strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // 2. Get positions
    const { data: positions, error: positionsError } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('weight_pct', { ascending: false });

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
    }

    // 2.1. Update current prices for all positions
    if (positions && positions.length > 0) {
      const symbols = positions.map(p => p.symbol);
      const pricePromises = symbols.map(async (symbol: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${symbol}`);
          const data = await response.json();
          return { symbol, price: data.c || 0 };
        } catch {
          return { symbol, price: 0 };
        }
      });

      const prices = await Promise.all(pricePromises);
      const priceMap = Object.fromEntries(prices.map(p => [p.symbol, p.price]));

      // First pass: Update prices and values
      for (const position of positions) {
        const currentPrice = priceMap[position.symbol];
        if (currentPrice > 0) {
          const currentValue = position.quantity * currentPrice;
          
          await supabase
            .from('strategy_positions')
            .update({
              current_price: currentPrice,
              current_value: currentValue
            })
            .eq('id', position.id);

          // Update local object
          position.current_price = currentPrice;
          position.current_value = currentValue;
          position.unrealized_pnl = currentValue - position.cost_basis;
          position.unrealized_pnl_pct = ((currentValue - position.cost_basis) / position.cost_basis) * 100;
        }
      }

      // Second pass: Calculate total portfolio value and update weights
      const totalPortfolioValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);

      if (totalPortfolioValue > 0) {
        for (const position of positions) {
          const weightPct = ((position.current_value || 0) / totalPortfolioValue) * 100;
          
          await supabase
            .from('strategy_positions')
            .update({
              weight_pct: weightPct
            })
            .eq('id', position.id);

          // Update local object
          position.weight_pct = weightPct;
        }
      }
    }

    // 3. Get recent transactions (last 50)
    const { data: transactions, error: transactionsError } = await supabase
      .from('strategy_transactions')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // 4. Get portfolio template (if exists)
    let portfolio = null;
    if (strategy.portfolio_id) {
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('id, name, stocks')
        .eq('id', strategy.portfolio_id)
        .single();
      
      portfolio = portfolioData;
    }

    // 5. Get rebalances history
    const { data: rebalances, error: rebalancesError } = await supabase
      .from('strategy_rebalances')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('rebalance_date', { ascending: false })
      .limit(10);

    if (rebalancesError) {
      console.error('Error fetching rebalances:', rebalancesError);
    }

    return NextResponse.json({
      strategy,
      positions: positions || [],
      transactions: transactions || [],
      rebalances: rebalances || [],
      portfolio
    });

  } catch (error) {
    console.error('Error in GET /api/strategies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/strategies/[id] - Update strategy (pause, resume, close)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyId = params.id;
    const body = await request.json();
    const { status, closed_reason } = body;

    const updates: any = { status };
    
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
      updates.closed_reason = closed_reason || 'User closed strategy';
    }

    const { data: strategy, error } = await supabase
      .from('active_strategies')
      .update(updates)
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating strategy:', error);
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
    }

    return NextResponse.json({ strategy });

  } catch (error) {
    console.error('Error in PATCH /api/strategies/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

