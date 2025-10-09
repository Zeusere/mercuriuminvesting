import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/strategies/main - Get user's main strategy with positions
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get main strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_main', true)
      .eq('status', 'active')
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ mainStrategy: null, positions: [] });
    }

    // Get positions with current prices
    const { data: positions, error: positionsError } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategy.id)
      .order('weight_pct', { ascending: false });

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
    }

    // Update current prices for all positions
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

    return NextResponse.json({
      mainStrategy: strategy,
      positions: positions || []
    });

  } catch (error) {
    console.error('Error in GET /api/strategies/main:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/strategies/main - Set a strategy as main
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategy_id } = await request.json();

    if (!strategy_id) {
      return NextResponse.json({ error: 'strategy_id is required' }, { status: 400 });
    }

    // Use the function to set main strategy
    const { error } = await supabase.rpc('set_main_strategy', {
      strategy_id_param: strategy_id,
      user_id_param: user.id
    });

    if (error) {
      console.error('Error setting main strategy:', error);
      return NextResponse.json({ error: 'Failed to set main strategy' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in POST /api/strategies/main:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

