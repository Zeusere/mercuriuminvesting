import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Types
interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  weight_pct: number;
  target_weight_pct?: number;
}

interface Trade {
  type: 'SELL' | 'BUY';
  symbol: string;
  quantity?: number;
  amount?: number;
  price: number;
  reason: string;
}

// Helper function to get stock quote
async function getStockQuote(symbol: string): Promise<number> {
  const response = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/bars/latest`, {
    headers: {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY!,
      'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }

  const data = await response.json();
  return data.bar?.c || 0;
}

// Calculate rebalance trades for equal weights
function calculateEqualWeightRebalance(positions: Position[]): Trade[] {
  const trades: Trade[] = [];
  const totalValue = positions.reduce((sum, pos) => sum + pos.current_value, 0);
  const targetValuePerStock = totalValue / positions.length;
  const targetWeightPercent = (100 / positions.length).toFixed(1);

  console.log(`DEBUG - Equal weight calculation:`);
  console.log(`Total portfolio value: $${totalValue.toFixed(2)}`);
  console.log(`Number of stocks: ${positions.length}`);
  console.log(`Target value per stock: $${targetValuePerStock.toFixed(2)}`);
  console.log(`Target weight per stock: ${targetWeightPercent}%`);

  let totalSellProceeds = 0;
  let totalBuyNeeded = 0;

  // Calculate what needs to be sold and bought
  const adjustments: { symbol: string; difference: number; currentValue: number; currentWeight: number }[] = [];
  
  positions.forEach(pos => {
    const difference = targetValuePerStock - pos.current_value;
    const currentWeight = (pos.current_value / totalValue) * 100;
    
    adjustments.push({
      symbol: pos.symbol,
      difference,
      currentValue: pos.current_value,
      currentWeight
    });

    console.log(`${pos.symbol}:`);
    console.log(`  Current: $${pos.current_value.toFixed(2)} (${currentWeight.toFixed(1)}%)`);
    console.log(`  Target:  $${targetValuePerStock.toFixed(2)} (${targetWeightPercent}%)`);
    console.log(`  Difference: $${difference.toFixed(2)} (${difference > 0 ? 'BUY' : 'SELL'})`);

    if (difference < 0) {
      totalSellProceeds += Math.abs(difference);
      console.log(`  → SELL needed: $${Math.abs(difference).toFixed(2)}`);
    } else if (difference > 0) {
      totalBuyNeeded += difference;
      console.log(`  → BUY needed: $${difference.toFixed(2)}`);
    } else {
      console.log(`  → NO TRADE needed`);
    }
  });

  console.log(`Total sell proceeds needed: $${totalSellProceeds.toFixed(2)}`);
  console.log(`Total buy needed: $${totalBuyNeeded.toFixed(2)}`);

  // Verify balance
  if (Math.abs(totalSellProceeds - totalBuyNeeded) > 1) {
    throw new Error(`Rebalance calculation error: sells ${totalSellProceeds.toFixed(2)} != buys ${totalBuyNeeded.toFixed(2)}`);
  }

  // Generate trades
  console.log(`\nGenerating trades...`);
  adjustments.forEach(adj => {
    const position = positions.find(p => p.symbol === adj.symbol)!;
    
    console.log(`\nProcessing ${adj.symbol}:`);
    console.log(`  Difference: $${adj.difference.toFixed(2)}`);
    console.log(`  Current weight: ${adj.currentWeight.toFixed(1)}%`);
    console.log(`  Target weight: ${targetWeightPercent}%`);
    
    if (adj.difference < -1) { // Only trade if difference is significant (>$1)
      // SELL: position is over-weighted
      const sellValue = Math.abs(adj.difference);
      const sharesToSell = sellValue / position.current_price;
      
      console.log(`  → GENERATING SELL TRADE: ${sharesToSell.toFixed(2)} shares for $${sellValue.toFixed(2)}`);
      
      trades.push({
        type: 'SELL',
        symbol: adj.symbol,
        quantity: sharesToSell,
        price: position.current_price,
        reason: `Selling to achieve equal weight (${adj.currentWeight.toFixed(1)}% → ${targetWeightPercent}%)`
      });
    } else if (adj.difference > 1) { // Only trade if difference is significant (>$1)
      // BUY: position is under-weighted
      const buyValue = adj.difference;
      
      console.log(`  → GENERATING BUY TRADE: $${buyValue.toFixed(2)}`);
      
      trades.push({
        type: 'BUY',
        symbol: adj.symbol,
        amount: buyValue,
        price: position.current_price,
        reason: `Buying to achieve equal weight (${adj.currentWeight.toFixed(1)}% → ${targetWeightPercent}%)`
      });
    } else {
      console.log(`  → NO TRADE (difference < $1)`);
    }
  });

  return trades;
}

// Calculate rebalance trades for target weights
function calculateTargetWeightRebalance(positions: Position[]): Trade[] {
  const trades: Trade[] = [];
  const totalValue = positions.reduce((sum, pos) => sum + pos.current_value, 0);

  console.log(`DEBUG - Target weight calculation:`);
  console.log(`Total portfolio value: $${totalValue.toFixed(2)}`);

  // Filter positions that actually need rebalancing (tolerance of 0.5%)
  const tolerance = 0.5; // 0.5% tolerance
  const positionsNeedingRebalance = positions.filter(pos => {
    if (!pos.target_weight_pct) return false;
    const weightDiff = Math.abs(pos.weight_pct - pos.target_weight_pct);
    const needsRebalance = weightDiff > tolerance;
    console.log(`${pos.symbol}: current ${pos.weight_pct.toFixed(2)}%, target ${pos.target_weight_pct}%, diff ${weightDiff.toFixed(2)}% - ${needsRebalance ? 'NEEDS REBALANCE' : 'AT TARGET'}`);
    return needsRebalance;
  });

  if (positionsNeedingRebalance.length === 0) {
    console.log('DEBUG - No positions need rebalancing (all within tolerance)');
    return trades;
  }

  let totalSellProceeds = 0;
  let totalBuyNeeded = 0;

  // Calculate what needs to be sold and bought (only for positions that need rebalancing)
  const adjustments: { symbol: string; difference: number; currentValue: number; targetValue: number }[] = [];
  
  positionsNeedingRebalance.forEach(pos => {
    const targetValue = totalValue * ((pos.target_weight_pct || 0) / 100);
    const difference = targetValue - pos.current_value;
    
    adjustments.push({
      symbol: pos.symbol,
      difference,
      currentValue: pos.current_value,
      targetValue
    });

    if (difference < 0) {
      totalSellProceeds += Math.abs(difference);
    } else if (difference > 0) {
      totalBuyNeeded += difference;
    }

    console.log(`${pos.symbol}: current $${pos.current_value.toFixed(2)} (${pos.weight_pct.toFixed(1)}%), target $${targetValue.toFixed(2)} (${pos.target_weight_pct}%), diff $${difference.toFixed(2)}`);
  });

  console.log(`Total sell proceeds needed: $${totalSellProceeds.toFixed(2)}`);
  console.log(`Total buy needed: $${totalBuyNeeded.toFixed(2)}`);

  // Verify balance
  if (Math.abs(totalSellProceeds - totalBuyNeeded) > 1) {
    throw new Error(`Rebalance calculation error: sells ${totalSellProceeds.toFixed(2)} != buys ${totalBuyNeeded.toFixed(2)}`);
  }

  // Generate trades (only for positions that need rebalancing)
  adjustments.forEach(adj => {
    const position = positions.find(p => p.symbol === adj.symbol)!;
    
    if (adj.difference < -1) { // Only sell if difference is significant (>$1)
      // SELL: position is over-weighted
      const sellValue = Math.abs(adj.difference);
      const sharesToSell = sellValue / position.current_price;
      
      trades.push({
        type: 'SELL',
        symbol: adj.symbol,
        quantity: sharesToSell,
        price: position.current_price,
        reason: `Selling to reach target weight (${position.weight_pct.toFixed(1)}% → ${position.target_weight_pct}%)`
      });
    } else if (adj.difference > 1) { // Only buy if difference is significant (>$1)
      // BUY: position is under-weighted
      const buyValue = adj.difference;
      
      trades.push({
        type: 'BUY',
        symbol: adj.symbol,
        amount: buyValue,
        price: position.current_price,
        reason: `Buying to reach target weight (${position.weight_pct.toFixed(1)}% → ${position.target_weight_pct}%)`
      });
    }
  });

  return trades;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { strategyId, rebalanceType } = await request.json();
    
    if (!strategyId || !rebalanceType) {
      return NextResponse.json(
        { error: 'Missing required fields: strategyId, rebalanceType' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify strategy ownership
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Fetch current positions
    const { data: positions, error: positionsError } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategyId);

    if (positionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch positions' },
        { status: 500 }
      );
    }

    if (!positions || positions.length === 0) {
      return NextResponse.json(
        { error: 'No positions found' },
        { status: 404 }
      );
    }

    // Fetch current prices and calculate current values
    const positionsWithPrices: Position[] = [];
    for (const pos of positions) {
      try {
        const currentPrice = await getStockQuote(pos.symbol);
        const currentValue = pos.quantity * currentPrice;
        const weightPct = (currentValue / (strategy.current_capital || strategy.initial_capital)) * 100;

        positionsWithPrices.push({
          symbol: pos.symbol,
          quantity: pos.quantity,
          average_price: pos.average_price,
          current_price: currentPrice,
          current_value: currentValue,
          weight_pct: weightPct,
          target_weight_pct: pos.target_weight_pct
        });
      } catch (error) {
        console.error(`Failed to fetch price for ${pos.symbol}:`, error);
        return NextResponse.json(
          { error: `Failed to fetch price for ${pos.symbol}` },
          { status: 500 }
        );
      }
    }

    // Calculate trades based on rebalance type
    let trades: Trade[] = [];
    
    if (rebalanceType === 'equal_weights') {
      trades = calculateEqualWeightRebalance(positionsWithPrices);
    } else if (rebalanceType === 'target_weights') {
      trades = calculateTargetWeightRebalance(positionsWithPrices);
    } else {
      return NextResponse.json(
        { error: 'Invalid rebalance type. Use "equal_weights" or "target_weights"' },
        { status: 400 }
      );
    }

    console.log(`DEBUG - Generated ${trades.length} trades for ${rebalanceType}`);
    trades.forEach(trade => {
      console.log(`${trade.type} ${trade.symbol}: ${trade.quantity || trade.amount} @ $${trade.price}`);
    });

    return NextResponse.json({
      success: true,
      trades,
      summary: {
        totalTrades: trades.length,
        sellTrades: trades.filter(t => t.type === 'SELL').length,
        buyTrades: trades.filter(t => t.type === 'BUY').length,
        rebalanceType
      }
    });

  } catch (error) {
    console.error('Rebalance calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rebalance trades', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
