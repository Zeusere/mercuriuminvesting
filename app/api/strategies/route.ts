import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/strategies - Create new active strategy (Run Strategy)
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolio_id, name, initial_capital, description } = body;

    if (!portfolio_id || !name || !initial_capital) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolio_id, name, initial_capital' },
        { status: 400 }
      );
    }

    // 1. Get portfolio to use as template
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // 2. Get current prices for all stocks
    const symbols = portfolio.stocks.map((s: any) => s.symbol);
    const pricePromises = symbols.map(async (symbol: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${symbol}`);
      const data = await response.json();
      return { symbol, price: data.c || 0 };
    });

    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map(p => [p.symbol, p.price]));

    // 3. Create active strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .insert({
        portfolio_id,
        user_id: user.id,
        name,
        description,
        start_date: new Date().toISOString(),
        initial_capital,
        current_capital: initial_capital,
        total_return_pct: 0,
        is_paper_trading: true,
        status: 'active'
      })
      .select()
      .single();

    if (strategyError) {
      console.error('Error creating strategy:', strategyError);
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }

    // 4. Calculate positions and create initial transactions
    const positions = [];
    const transactions = [];

    for (const stock of portfolio.stocks) {
      const targetAmount = (initial_capital * stock.weight) / 100;
      const currentPrice = priceMap[stock.symbol];
      
      if (!currentPrice || currentPrice === 0) {
        console.warn(`No price for ${stock.symbol}, skipping`);
        continue;
      }

      const quantity = targetAmount / currentPrice;

      // Create position
      const { data: position, error: positionError } = await supabase
        .from('strategy_positions')
        .insert({
          strategy_id: strategy.id,
          symbol: stock.symbol,
          quantity,
          average_price: currentPrice,
          cost_basis: targetAmount,
          current_price: currentPrice,
          current_value: targetAmount,
          target_weight_pct: stock.weight,
          first_purchase_date: new Date().toISOString()
        })
        .select()
        .single();

      if (positionError) {
        console.error('Error creating position:', positionError);
        continue;
      }

      positions.push(position);

      // Create BUY transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('strategy_transactions')
        .insert({
          strategy_id: strategy.id,
          transaction_date: new Date().toISOString(),
          type: 'BUY',
          symbol: stock.symbol,
          quantity,
          price: currentPrice,
          amount: -targetAmount, // Negative = money out
          fees: 0,
          notes: 'Initial purchase'
        })
        .select()
        .single();

      if (!transactionError) {
        transactions.push(transaction);
      }
    }

    // 5. Create initial rebalance record
    await supabase
      .from('strategy_rebalances')
      .insert({
        strategy_id: strategy.id,
        rebalance_date: new Date().toISOString(),
        capital_before: initial_capital,
        positions_before: [],
        capital_after: initial_capital,
        positions_after: positions,
        transactions: transactions,
        reason: 'initial',
        triggered_by: 'user',
        notes: 'Strategy initialized'
      });

    return NextResponse.json({
      strategy,
      positions,
      transactions
    });

  } catch (error) {
    console.error('Error in POST /api/strategies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/strategies - Get user's active strategies
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const { data: strategies, error } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
    }

    // Update current_capital for each strategy
    if (strategies && strategies.length > 0) {
      for (const strategy of strategies) {
        // Get positions for this strategy
        const { data: positions } = await supabase
          .from('strategy_positions')
          .select('*')
          .eq('strategy_id', strategy.id);

        if (positions && positions.length > 0) {
          // Get current prices
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
              position.current_value = currentValue;
            }
          }

          // Calculate total current value
          const totalCurrentValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);

          // Second pass: Update weights
          if (totalCurrentValue > 0) {
            for (const position of positions) {
              const weightPct = ((position.current_value || 0) / totalCurrentValue) * 100;
              
              await supabase
                .from('strategy_positions')
                .update({
                  weight_pct: weightPct
                })
                .eq('id', position.id);
            }
          }

          // Update strategy current_capital and total_return_pct
          const totalReturnPct = ((totalCurrentValue - strategy.initial_capital) / strategy.initial_capital) * 100;
          
          await supabase
            .from('active_strategies')
            .update({
              current_capital: totalCurrentValue,
              total_return_pct: totalReturnPct
            })
            .eq('id', strategy.id);

          // Update local object
          strategy.current_capital = totalCurrentValue;
          strategy.total_return_pct = totalReturnPct;
        }
      }
    }

    return NextResponse.json({ strategies });

  } catch (error) {
    console.error('Error in GET /api/strategies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

