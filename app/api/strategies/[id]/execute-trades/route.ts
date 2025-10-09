import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Trade {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity?: number; // For SELL trades (shares to sell)
  amount?: number; // For BUY trades (dollar amount to invest)
  price?: number; // If not provided, fetch current price
  reason?: string;
}

// Helper function to get stock quote directly (avoiding HTTP calls to self)
async function getStockQuote(symbol: string) {
  try {
    const alpacaKey = process.env.ALPACA_API_KEY;
    const alpacaSecret = process.env.ALPACA_API_SECRET;

    if (!alpacaKey || !alpacaSecret) {
      console.log(`DEBUG - Alpaca API keys not configured for ${symbol}`);
      return { symbol, price: 0 };
    }

    const response = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    );

    if (!response.ok) {
      console.log(`DEBUG - Alpaca API error for ${symbol}: ${response.status}`);
      return { symbol, price: 0 };
    }

    const snapshot = await response.json();
    const currentPrice = snapshot.latestTrade?.p || snapshot.dailyBar?.c || snapshot.prevDailyBar?.c || 0;

    console.log(`DEBUG - Price for ${symbol}: $${currentPrice}`);
    return { symbol, price: currentPrice };
  } catch (error) {
    console.log(`DEBUG - Error fetching price for ${symbol}:`, error);
    return { symbol, price: 0 };
  }
}

// POST /api/strategies/[id]/execute-trades - Execute trades for a strategy
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DEBUG - Execute trades started for strategy:', params.id);
    console.log('DEBUG - Environment variables check:');
    console.log('DEBUG - ALPACA_API_KEY exists:', !!process.env.ALPACA_API_KEY);
    console.log('DEBUG - ALPACA_API_SECRET exists:', !!process.env.ALPACA_API_SECRET);
    
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('DEBUG - Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategyId = params.id;
    const body = await request.json();
    console.log('DEBUG - Request body:', JSON.stringify(body, null, 2));
    
    const { trades, reason = 'manual', notes } = body as { 
      trades: Trade[], 
      reason?: string,
      notes?: string 
    };

    if (!trades || trades.length === 0) {
      console.log('DEBUG - No trades provided');
      return NextResponse.json({ error: 'No trades provided' }, { status: 400 });
    }

    console.log('DEBUG - Processing trades:', trades.length);

    // Validate trade balance for rebalancing operations
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const buyTrades = trades.filter(t => t.type === 'BUY');
    
    if (sellTrades.length > 0 && buyTrades.length > 0) {
      // Calculate total amounts
      const totalSellAmount = sellTrades.reduce((sum, trade) => {
        const price = trade.price || priceMap[trade.symbol] || 0;
        const quantity = trade.quantity || 0;
        return sum + (price * quantity);
      }, 0);
      
      const totalBuyAmount = buyTrades.reduce((sum, trade) => {
        return sum + (trade.amount || 0);
      }, 0);
      
      console.log(`DEBUG - Trade balance check: SELL=${totalSellAmount.toFixed(2)}, BUY=${totalBuyAmount.toFixed(2)}`);
      
      // Allow $10 tolerance for rounding differences
      const tolerance = 10;
      const difference = Math.abs(totalSellAmount - totalBuyAmount);
      
      if (difference > tolerance) {
        console.error(`DEBUG - Trade balance ERROR: Difference of $${difference.toFixed(2)} exceeds tolerance of $${tolerance}`);
        console.error(`DEBUG - This will cause incorrect portfolio valuation`);
        console.error(`DEBUG - SELL trades: ${sellTrades.length}, BUY trades: ${buyTrades.length}`);
        console.error(`DEBUG - REJECTING trades to prevent money creation`);
        
        return NextResponse.json(
          { 
            error: 'Trade balance error', 
            message: `Trade imbalance detected: $${difference.toFixed(2)} difference between sells and buys. This would create money artificially.`,
            details: {
              totalSellAmount: totalSellAmount,
              totalBuyAmount: totalBuyAmount,
              difference: difference,
              tolerance: tolerance
            }
          }, 
          { status: 400 }
        );
      } else {
        console.log(`DEBUG - Trade balance OK: Difference of $${difference.toFixed(2)} within tolerance`);
      }
    }

    // 1. Verify strategy ownership
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    if (strategy.status !== 'active') {
      return NextResponse.json({ error: 'Strategy is not active' }, { status: 400 });
    }

    // 2. Get current positions
    const { data: currentPositions } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategyId);

    const positionsMap = new Map(
      (currentPositions || []).map(p => [p.symbol, p])
    );

    // 3. Get current prices for all symbols in trades
    const symbols = trades.map(t => t.symbol);
    const uniqueSymbols = [...new Set(symbols)];
    console.log('DEBUG - Getting prices for symbols:', uniqueSymbols);
    
    const pricePromises = uniqueSymbols.map(symbol => getStockQuote(symbol));
    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map(p => [p.symbol, p.price]));
    
    console.log('DEBUG - Price map:', priceMap);

    // 4. Create rebalance snapshot (before state)
    const { data: rebalance, error: rebalanceError } = await supabase
      .from('strategy_rebalances')
      .insert({
        strategy_id: strategyId,
        rebalance_date: new Date().toISOString(),
        capital_before: strategy.current_capital || strategy.initial_capital,
        positions_before: currentPositions || [],
        capital_after: 0, // Will update after trades
        positions_after: [], // Will update after trades
        transactions: [],
        reason,
        triggered_by: 'user',
        notes
      })
      .select()
      .single();

    if (rebalanceError) {
      console.error('Error creating rebalance:', rebalanceError);
      return NextResponse.json({ error: 'Failed to create rebalance record' }, { status: 500 });
    }

    // 5. Execute each trade
    const executedTransactions = [];

    for (const trade of trades) {
      console.log(`DEBUG - Processing trade:`, trade);
      const currentPrice = trade.price || priceMap[trade.symbol];
      
      if (!currentPrice || currentPrice === 0) {
        console.warn(`No price for ${trade.symbol}, skipping trade`);
        continue;
      }

      const currentPosition = positionsMap.get(trade.symbol);
      console.log(`DEBUG - Current position for ${trade.symbol}:`, currentPosition);
      console.log(`DEBUG - Trade type: ${trade.type}, Symbol: ${trade.symbol}`);
      console.log(`DEBUG - Trade quantity: ${trade.quantity}, Trade amount: ${trade.amount}`);

      if (trade.type === 'SELL') {
        console.log(`DEBUG - Processing SELL trade for ${trade.symbol}`);
        
        // Validate we have quantity for SELL
        if (!trade.quantity) {
          console.warn(`No quantity specified for SELL ${trade.symbol}`);
          continue;
        }

        // Validate we have enough shares
        if (!currentPosition) {
          console.warn(`No position found for ${trade.symbol}`);
          continue;
        }
        
        // Allow small rounding differences (0.01 shares tolerance)
        const tolerance = 0.01;
        if (currentPosition.quantity < trade.quantity - tolerance) {
          console.warn(`Insufficient shares for ${trade.symbol}. Have: ${currentPosition.quantity}, Trying to sell: ${trade.quantity}`);
          continue;
        }
        
        // If we're within tolerance, adjust the quantity to match what we actually have
        const actualSellQuantity = Math.min(trade.quantity, currentPosition.quantity);
        if (Math.abs(actualSellQuantity - trade.quantity) > tolerance) {
          console.log(`DEBUG - Adjusting sell quantity from ${trade.quantity} to ${actualSellQuantity} for ${trade.symbol}`);
        }
        
        const amount = actualSellQuantity * currentPrice;
        console.log(`DEBUG - SELL amount calculated: ${amount}`);
        
        console.log(`DEBUG - SELL validation passed for ${trade.symbol}`);

        // Create SELL transaction
        const { data: transaction } = await supabase
          .from('strategy_transactions')
          .insert({
            strategy_id: strategyId,
            transaction_date: new Date().toISOString(),
            type: 'SELL',
            symbol: trade.symbol,
            quantity: actualSellQuantity,
            price: currentPrice,
            amount: amount, // Positive = money in
            fees: 0,
            rebalance_id: rebalance.id,
            notes: trade.reason || 'Manual sell'
          })
          .select()
          .single();

        if (transaction) {
          executedTransactions.push(transaction);
        }

        // Update or delete position
        const newQuantity = currentPosition.quantity - actualSellQuantity;
        
        if (newQuantity <= 0.001) {
          // Delete position if fully sold
          await supabase
            .from('strategy_positions')
            .delete()
            .eq('id', currentPosition.id);
          
          positionsMap.delete(trade.symbol);
        } else {
          // Update position
          const newCostBasis = currentPosition.cost_basis * (newQuantity / currentPosition.quantity);
          
          const { data: updatedPosition } = await supabase
            .from('strategy_positions')
            .update({
              quantity: newQuantity,
              cost_basis: newCostBasis,
              current_value: newQuantity * currentPrice
            })
            .eq('id', currentPosition.id)
            .select()
            .single();
          
          if (updatedPosition) {
            positionsMap.set(trade.symbol, updatedPosition);
          }
        }

      } else if (trade.type === 'BUY') {
        // IMPORTANT: Always use current market price for BUY trades
        const marketPrice = priceMap[trade.symbol];
        if (!marketPrice || marketPrice === 0) {
          console.warn(`No market price for ${trade.symbol}, skipping buy`);
          continue;
        }

        // Calculate shares and amount
        let actualQuantity: number;
        let actualAmount: number;

        if (trade.amount !== undefined) {
          // AI provided dollar amount - calculate shares from it
          actualAmount = trade.amount;
          actualQuantity = actualAmount / marketPrice;
        } else if (trade.quantity !== undefined) {
          // AI provided shares - calculate amount from it
          actualQuantity = trade.quantity;
          actualAmount = actualQuantity * marketPrice;
        } else {
          console.warn(`No quantity or amount for ${trade.symbol}, skipping buy`);
          continue;
        }

        // Create BUY transaction
        const { data: transaction } = await supabase
          .from('strategy_transactions')
          .insert({
            strategy_id: strategyId,
            transaction_date: new Date().toISOString(),
            type: 'BUY',
            symbol: trade.symbol,
            quantity: actualQuantity,
            price: marketPrice,
            amount: -actualAmount, // Negative = money out
            fees: 0,
            rebalance_id: rebalance.id,
            notes: trade.reason || 'Manual buy'
          })
          .select()
          .single();

        if (transaction) {
          executedTransactions.push(transaction);
        }

        if (currentPosition) {
          // Update existing position (average price)
          const totalQuantity = currentPosition.quantity + actualQuantity;
          const totalCost = currentPosition.cost_basis + actualAmount;
          const newAvgPrice = totalCost / totalQuantity;

          const { data: updatedPosition } = await supabase
            .from('strategy_positions')
            .update({
              quantity: totalQuantity,
              average_price: newAvgPrice,
              cost_basis: totalCost,
              current_price: marketPrice,
              current_value: totalQuantity * marketPrice
            })
            .eq('id', currentPosition.id)
            .select()
            .single();
          
          if (updatedPosition) {
            positionsMap.set(trade.symbol, updatedPosition);
          }
        } else {
          // Create new position
          const { data: newPosition } = await supabase
            .from('strategy_positions')
            .insert({
              strategy_id: strategyId,
              symbol: trade.symbol,
              quantity: actualQuantity,
              average_price: marketPrice,
              cost_basis: actualAmount,
              current_price: marketPrice,
              current_value: actualAmount,
              target_weight_pct: 0, // No target for manually added stocks
              first_purchase_date: new Date().toISOString()
            })
            .select()
            .single();
          
          if (newPosition) {
            positionsMap.set(trade.symbol, newPosition);
          }
        }
      }
    }

    // 6. Get updated positions and recalculate weights
    const { data: finalPositions } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategyId);

    const totalValue = (finalPositions || []).reduce((sum, p) => sum + (p.current_value || 0), 0);

    // Update weights for all positions
    for (const position of finalPositions || []) {
      await supabase
        .from('strategy_positions')
        .update({
          weight_pct: totalValue > 0 ? (position.current_value / totalValue) * 100 : 0
        })
        .eq('id', position.id);
    }

    // 7. Update rebalance with after state
    await supabase
      .from('strategy_rebalances')
      .update({
        capital_after: totalValue,
        positions_after: finalPositions || [],
        transactions: executedTransactions
      })
      .eq('id', rebalance.id);

    // 8. Strategy capital is auto-updated by trigger
    
    return NextResponse.json({
      success: true,
      transactions: executedTransactions,
      positions: finalPositions,
      rebalance_id: rebalance.id
    });

  } catch (error) {
    console.error('Error in POST /api/strategies/[id]/execute-trades:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

