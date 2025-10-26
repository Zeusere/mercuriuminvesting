import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActiveStrategy, StrategyPosition, TradePreview } from '@/types/strategy';
import type { AutomationAction } from '@/types/automation';

/**
 * Generate trades needed for rebalancing
 */
export async function generateRebalanceTrades(
  strategy: ActiveStrategy,
  action: AutomationAction,
  positions: StrategyPosition[]
): Promise<TradePreview[]> {
  
  // Fetch current market prices
  const prices = await fetchCurrentPrices(positions.map(p => p.symbol));
  
  // Calculate target weights based on action
  let targetWeights: Record<string, number> = {};
  
  if (action === 'rebalance_to_target') {
    // Use target_weight_pct from positions
    positions.forEach(p => {
      targetWeights[p.symbol] = p.target_weight_pct || 0;
    });
  } else if (action === 'rebalance_equal_weight') {
    // Equal weight for all positions
    const equalWeight = 100 / positions.length;
    positions.forEach(p => {
      targetWeights[p.symbol] = equalWeight;
    });
  } else {
    throw new Error(`Unsupported action: ${action}`);
  }
  
  // Calculate total portfolio value
  const totalValue = positions.reduce((sum, p) => {
    const currentPrice = prices[p.symbol] || 0;
    return sum + (p.quantity * currentPrice);
  }, 0);
  
  if (totalValue === 0) {
    throw new Error('Portfolio value is zero');
  }
  
  // Generate trades
  const trades: TradePreview[] = [];
  
  for (const position of positions) {
    const currentPrice = prices[position.symbol];
    if (!currentPrice || currentPrice === 0) continue;
    
    const currentValue = position.quantity * currentPrice;
    const targetValue = (targetWeights[position.symbol] / 100) * totalValue;
    const difference = targetValue - currentValue;
    
    // Only trade if difference is significant (> $10)
    if (Math.abs(difference) > 10) {
      if (difference < 0) {
        // Need to SELL
        const sharesToSell = Math.abs(difference) / currentPrice;
        
        // Don't sell more than we have
        if (sharesToSell <= position.quantity) {
          trades.push({
            type: 'SELL',
            symbol: position.symbol,
            quantity: sharesToSell,
            price: currentPrice,
            amount: Math.abs(difference),
            reason: 'Rebalance (over-weighted)',
          });
        }
      } else {
        // Need to BUY
        trades.push({
          type: 'BUY',
          symbol: position.symbol,
          quantity: 0, // Will be calculated by backend
          amount: difference,
          price: currentPrice,
          reason: 'Rebalance (under-weighted)',
        });
      }
    }
  }
  
  return trades;
}

/**
 * Generate trades to close all positions (for stop loss / take profit)
 */
export async function generateCloseAllTrades(
  positions: StrategyPosition[]
): Promise<TradePreview[]> {
  
  const prices = await fetchCurrentPrices(positions.map(p => p.symbol));
  const trades: TradePreview[] = [];
  
  for (const position of positions) {
    const currentPrice = prices[position.symbol];
    if (!currentPrice || currentPrice === 0) continue;
    
    if (position.quantity > 0) {
      trades.push({
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentPrice,
        amount: position.quantity * currentPrice,
        reason: 'Close position (automation)',
      });
    }
  }
  
  return trades;
}

/**
 * Generate trades to close specific positions
 */
export async function generateClosePositionTrades(
  positions: StrategyPosition[],
  symbols: string[]
): Promise<TradePreview[]> {
  
  const targetPositions = positions.filter(p => symbols.includes(p.symbol));
  return generateCloseAllTrades(targetPositions);
}

/**
 * Fetch current market prices for symbols
 */
async function fetchCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  
  const pricePromises = symbols.map(async (symbol) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${symbol}`
      );
      const data = await response.json();
      return { symbol, price: data.c || 0 };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return { symbol, price: 0 };
    }
  });
  
  const prices = await Promise.all(pricePromises);
  prices.forEach(p => {
    priceMap[p.symbol] = p.price;
  });
  
  return priceMap;
}

/**
 * Validate that trades balance (total sells = total buys)
 */
export function validateTradesBalance(trades: TradePreview[]): {
  valid: boolean;
  totalSells: number;
  totalBuys: number;
  difference: number;
} {
  const sells = trades.filter(t => t.type === 'SELL');
  const buys = trades.filter(t => t.type === 'BUY');
  
  const totalSells = sells.reduce((sum, t) => sum + (t.quantity! * t.price), 0);
  const totalBuys = buys.reduce((sum, t) => sum + t.amount!, 0);
  
  const difference = Math.abs(totalSells - totalBuys);
  const valid = difference < 1; // Allow $1 rounding difference
  
  return {
    valid,
    totalSells,
    totalBuys,
    difference,
  };
}

