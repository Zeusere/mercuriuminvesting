import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get stock quote directly (avoiding HTTP calls to self)
async function getStockQuote(symbol: string) {
  try {
    const alpacaKey = process.env.ALPACA_API_KEY;
    const alpacaSecret = process.env.ALPACA_API_SECRET;

    if (!alpacaKey || !alpacaSecret) {
      console.log(`DEBUG - Alpaca API keys not configured for ${symbol}`);
      return { symbol, price: 0, change_pct: 0 };
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
      return { symbol, price: 0, change_pct: 0 };
    }

    const snapshot = await response.json();
    const currentPrice = snapshot.latestTrade?.p || snapshot.dailyBar?.c || snapshot.prevDailyBar?.c || 0;
    const prevClose = snapshot.prevDailyBar?.c || 0;
    const changePct = prevClose ? ((currentPrice - prevClose) / prevClose * 100) : 0;

    console.log(`DEBUG - Price for ${symbol}: $${currentPrice} (${changePct.toFixed(2)}%)`);
    return { symbol, price: currentPrice, change_pct: changePct };
  } catch (error) {
    console.log(`DEBUG - Error fetching price for ${symbol}:`, error);
    return { symbol, price: 0, change_pct: 0 };
  }
}

// POST /api/ai/strategy-assistant - AI chat for strategy optimization
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { strategy_id, user_message, chat_history = [] } = body;

    if (!strategy_id || !user_message) {
      return NextResponse.json(
        { error: 'Missing required fields: strategy_id, user_message' },
        { status: 400 }
      );
    }

    // 1. Fetch strategy data
    const { data: strategy, error: strategyError } = await supabase
      .from('active_strategies')
      .select('*')
      .eq('id', strategy_id)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // 2. Fetch positions
    const { data: positions } = await supabase
      .from('strategy_positions')
      .select('*')
      .eq('strategy_id', strategy_id)
      .order('weight_pct', { ascending: false });

    // 3. Fetch portfolio template (for target weights)
    let portfolio = null;
    if (strategy.portfolio_id) {
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', strategy.portfolio_id)
        .single();
      
      portfolio = portfolioData;
    }

    // 4. Get current market prices for ALL stocks (including those to potentially buy)
    // Get symbols from positions + portfolio template + mentioned in user message/history
    const positionSymbols = (positions || []).map((p: any) => p.symbol);
    const templateSymbols = portfolio?.stocks?.map((s: any) => s.symbol) || [];

    // Extract potential tickers from free text (user message + history)
    const textToScan = [user_message, ...chat_history.map((m: any) => m.content)].join(' ');
    // Convert to uppercase and extract potential tickers (2-5 uppercase letters)
    // Filter out common English words that aren't stock symbols
    const commonWords = new Set(['THE', 'FOR', 'ARE', 'NOT', 'YOU', 'CAN', 'WAS', 'HIS', 'HER', 'ITS', 'ALL', 'BUT', 'HAD', 'HAS', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'MIGHT', 'MAY', 'MUST', 'SHALL', 'DOES', 'DID', 'DONE', 'BEEN', 'BEING', 'HAVE', 'HAS', 'HAD', 'HAVING', 'TO', 'OF', 'IN', 'ON', 'AT', 'BY', 'FOR', 'WITH', 'FROM', 'UP', 'DOWN', 'OUT', 'OFF', 'OVER', 'UNDER', 'AGAIN', 'FURTHER', 'THEN', 'ONCE', 'HERE', 'THERE', 'WHEN', 'WHERE', 'WHY', 'HOW', 'ALL', 'ANY', 'BOTH', 'EACH', 'FEW', 'MORE', 'MOST', 'OTHER', 'SOME', 'SUCH', 'NO', 'NOR', 'NOT', 'ONLY', 'OWN', 'SAME', 'SO', 'THAN', 'TOO', 'VERY', 'S', 'T', 'CAN', 'WILL', 'JUST', 'DON', 'SHOULD', 'NOW', 'VENDE', 'COMPRA', 'HI', 'YOUR', 'IS', 'DOWN', 'SINCE', 'OCT', 'HELP', 'OR', 'MAKE', 'WHAT', 'WOULD', 'LIKE', 'DO', 'IT', 'SEEMS', 'THERE', 'WAS', 'IN', 'THE', 'FOR', 'ARE', 'NOT', 'DATA', 'NEED', 'PRICE', 'EXACT', 'OF', 'BUY', 'AFTER', 'THIS', 'TRADE', 'COULD', 'ANY', 'OTHER', 'THAT', 'MIGHT', 'BE']);
    
    const potentialSymbols = Array.from(new Set(
      (textToScan.toUpperCase().match(/\b[A-Z]{2,5}\b/g) || [])
        .filter(symbol => !commonWords.has(symbol))
    ));

    // Merge all sources
    const allSymbols = [...new Set([...positionSymbols, ...templateSymbols, ...potentialSymbols])];
    
    console.log('DEBUG - Symbols to fetch prices for:', allSymbols);
    console.log('DEBUG - User message:', user_message);
    console.log('DEBUG - Potential symbols from text:', potentialSymbols);
    
    const pricePromises = allSymbols.map(symbol => getStockQuote(symbol));

    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map(p => [p.symbol, { price: p.price, change_pct: p.change_pct }]));

    // 5. Build comprehensive context for AI
    const positionsContext = (positions || []).map((p: any) => {
      const currentData = priceMap[p.symbol] || { price: p.current_price, change_pct: 0 };
      const targetWeight = portfolio?.stocks?.find((s: any) => s.symbol === p.symbol)?.weight || 0;
      
      return `
  ${p.symbol}:
    - Quantity: ${p.quantity.toFixed(2)} shares
    - Avg Purchase Price: $${p.average_price.toFixed(2)}
    - Current Price: $${currentData.price.toFixed(2)} (${currentData.change_pct > 0 ? '+' : ''}${currentData.change_pct.toFixed(2)}% today)
    - Current Value: $${p.current_value?.toFixed(2) || 0}
    - Unrealized P/L: ${p.unrealized_pnl_pct ? p.unrealized_pnl_pct.toFixed(2) + '%' : 'N/A'}
    - Current Weight: ${p.weight_pct?.toFixed(2) || 0}%
    - Target Weight: ${targetWeight}%
    - Deviation: ${p.weight_pct ? (p.weight_pct - targetWeight).toFixed(2) : 0}%`;
    }).join('\n');

    const systemPrompt = `You are an expert AI investment strategy assistant helping users optimize their active trading strategies.

CURRENT STRATEGY OVERVIEW:
Name: ${strategy.name}
Status: ${strategy.status}
Started: ${new Date(strategy.start_date).toLocaleDateString()}
Initial Capital: $${strategy.initial_capital.toLocaleString()}
Current Capital: $${(strategy.current_capital || strategy.initial_capital).toLocaleString()}
Total Return: ${strategy.total_return_pct?.toFixed(2) || 0}%
Type: ${strategy.is_paper_trading ? 'Paper Trading' : 'Real Money'}

CURRENT POSITIONS:
${positionsContext}

TRADING RULES:
- For REBALANCING operations (equal weights, target weights): You can ONLY work with stocks in CURRENT POSITIONS
- For REGULAR trades (buy/sell specific stocks): You can trade ANY stock, even if not in current positions
- When user asks to rebalance "all stocks", it means ALL stocks currently in the portfolio
- When user asks to "buy META" or "sell GOOG and buy AAPL", you can trade any stocks mentioned

TOTAL PORTFOLIO VALUE: $${(strategy.current_capital || strategy.initial_capital).toLocaleString()}

FUNDAMENTAL PRINCIPLE - CONSERVATION OF CAPITAL:
In ANY rebalancing operation, the total portfolio value CANNOT change.
- If you sell $X, you have exactly $X in cash to reinvest
- If you buy $Y worth of stocks, you need exactly $Y in cash
- Therefore: Total $ sold = Total $ bought (always, no exceptions)

YOUR CAPABILITIES:
You can analyze the current positions and execute ANY combination of trades the user requests:

REGULAR TRADES (any stocks):
- "Sell MDB and buy META" → Sell MDB (if owned), buy META (even if not in portfolio)
- "Buy 100 shares of AAPL" → Buy AAPL even if not currently owned
- "Sell GOOG and buy TSLA" → Trade any stocks mentioned by user

REBALANCING OPERATIONS (current positions only):
- "Make all stocks equal weight" → Use ALL stocks in CURRENT POSITIONS, calculate equal target for each
- "Sell TSLA and split equally into other stocks" → Sell TSLA, distribute proceeds among remaining stocks in CURRENT POSITIONS
- "Rebalance to target weights" → Use stocks in CURRENT POSITIONS with their target percentages

CRITICAL CONSTRAINTS:
- For REBALANCING: Only use stocks in CURRENT POSITIONS
- For REGULAR TRADES: You can trade ANY stock the user mentions

CALCULATION PROCESS (for ANY request):
1. UNDERSTAND what the user wants (target state)
2. CALCULATE current values: For each position, current_value = quantity × current_price
3. CALCULATE target values: Based on user's request
4. IDENTIFY what to sell: Positions where current_value > target_value
5. IDENTIFY what to buy: Positions where current_value < target_value
6. CALCULATE proceeds: Total $ from all sells
7. ALLOCATE proceeds: Distribute exact proceeds amount across all buys
8. VERIFY: sum(sell amounts) = sum(buy amounts)

CRITICAL RULES:
- You work with DOLLAR AMOUNTS, not percentages or ratios
- For SELL trades: specify "quantity" (shares to sell) based on current position
- For BUY trades: specify "amount" (dollars to invest) from sell proceeds
- The system calculates shares automatically for buys: shares = amount / current_price
- NEVER generate trades where total buy amount ≠ total sell amount
- If user asks for something impossible (e.g., sell more than owned), explain why

YOUR ROLE:
- Understand user's intent (what rebalancing they want)
- Calculate exact dollar amounts for each trade
- Ensure mathematical correctness (sells = buys)
- Provide clear explanations
- Be flexible - handle ANY valid rebalancing request

RESPONSE FORMAT:
You MUST respond in valid JSON format with this structure:

FOR SELL TRADES:
{
  "type": "SELL",
  "symbol": "MU",
  "quantity": 79.91,  // Number of shares to sell
  "price": 195.37,    // Current market price
  "reason": "Selling to rebalance"
}
// DO NOT include "amount" field for SELL trades

FOR BUY TRADES:
{
  "type": "BUY", 
  "symbol": "GOOG",
  "amount": 15611.71,  // Dollar amount to invest
  "price": 245.36,     // Current market price
  "reason": "Buying with sell proceeds"
}
// DO NOT include "quantity" field for BUY trades

COMPLETE RESPONSE:
{
  "message": "Natural language explanation of your recommendation",
  "trades": [
    // Array of SELL and BUY trades as shown above
  ],
  "impact": {
    "estimated_return_change": "e.g., +2.3% annualized",
    "risk_change": "e.g., Moderate increase in volatility",
    "expected_allocation": {
      "SYMBOL1": percentage after trades,
      "SYMBOL2": percentage after trades
    }
  }
}

CRITICAL RULES:
- SELL trades: ONLY include "quantity" field, NEVER "amount"
- BUY trades: ONLY include "amount" field, NEVER "quantity"
- The system calculates shares for BUY trades automatically: shares = amount / price

STEP-BY-STEP REBALANCING PROCESS:

STEP 1: UNDERSTAND THE REQUEST
- Parse what the user wants (equal weights, sell X buy Y, adjust specific positions, etc.)
- CRITICAL: Only work with stocks that are in CURRENT POSITIONS above
- If user says "all stocks", it means ALL stocks currently in the portfolio, not the original template

STEP 2: CALCULATE CURRENT STATE
- For each position: current_value = quantity_owned × current_market_price
- Total portfolio value = sum of all current_values

STEP 3: CALCULATE TARGET STATE
- Based on user request, determine target_value for each position
- For "equal weights": target_value = total_portfolio_value / number_of_positions
- For "rebalance to targets": use the target weight percentages shown in CURRENT POSITIONS
- Examples:
  * "Equal weights" → each position = total_value / number_of_positions
  * "Rebalance to targets" → each position = total_value × (target_weight% / 100)
  * "Sell all GOOG, buy AMD" → GOOG target = $0, AMD target = AMD_current + GOOG_current

STEP 4: IDENTIFY TRADES NEEDED
- For each position, calculate: difference = target_value - current_value
- If difference < 0 → SELL (position is over-weighted, current_weight > target_weight)
- If difference > 0 → BUY (position is under-weighted, current_weight < target_weight)
- If difference = 0 → NO TRADE (position is at target)

CRITICAL LOGIC:
- NEVER buy more of a position that is already OVER-WEIGHTED
- NEVER sell from a position that is already UNDER-WEIGHTED
- Only buy positions that are BELOW their target weight
- Only sell positions that are ABOVE their target weight

STEP 5: CALCULATE EXACT AMOUNTS
- Total sell proceeds = sum of |difference| for all positions with difference < 0
- Total buy needed = sum of |difference| for all positions with difference > 0
- These MUST be equal (conservation of capital)

STEP 6: FORMAT TRADES
- SELL trades: { "type": "SELL", "symbol": "X", "quantity": shares_to_sell, "price": current_price }
  * shares_to_sell = |difference| / current_price
- BUY trades: { "type": "BUY", "symbol": "Y", "amount": dollars_to_invest, "price": current_price }
  * dollars_to_invest = |difference|

STEP 7: FINAL VERIFICATION (MANDATORY - DO NOT SKIP)
- Calculate: total_sell_proceeds = sum(SELL.quantity × SELL.price)
- Calculate: total_buy_amount = sum(BUY.amount)
- Verify: |total_sell_proceeds - total_buy_amount| < $1
- If not balanced, YOU MUST recalculate ALL trades before generating response
- The backend will REJECT your trades if they don't balance

WORKED EXAMPLE - "Rebalance to target weights" with real data:

CURRENT STATE (example):
- GOOG: $25,511.50 (25.01% weight, target: 10%) → OVER-WEIGHTED by $15,306.90
- INTC: $15,042.24 (14.75% weight, target: 15%) → UNDER-WEIGHTED by $42.24
- TSLA: $14,952.43 (14.66% weight, target: 10%) → OVER-WEIGHTED by $4,765.55
- Total portfolio: $102,000

TARGET STATE (using target weights):
- GOOG: $102,000 × 0.10 = $10,204.60 (need to reduce by $15,306.90)
- INTC: $102,000 × 0.15 = $15,300.00 (need to increase by $257.76)
- TSLA: $102,000 × 0.10 = $10,204.60 (need to reduce by $4,747.83)

CALCULATE TRADES:
- Total to sell: $15,306.90 + $4,747.83 = $20,054.73
- Total to buy: $257.76 + (other under-weighted positions)
- Must distribute $20,054.73 among ALL under-weighted positions

LOGIC: Sell from over-weighted positions (GOOG, TSLA), buy for under-weighted positions (INTC, MDB, AVAV, LRCX, AMD, AVGO)

OTHER EXAMPLES:
1. "Sell PLTR and buy AMD" → PLTR target = 0, AMD target = current + PLTR value
2. "Sell 50% of COIN and split into BBAI and NET equally" → Sell half COIN, buy half proceeds in each
3. "Reduce AMD to 15% and increase SNOW to 25%" → Calculate new targets, rebalance

CONSTRAINTS:
- Cannot sell more shares than owned (check quantity in CURRENT POSITIONS)
- Cannot create money (total sells = total buys, always)
- Must use CURRENT MARKET PRICES for all calculations

⚠️ CRITICAL WARNING ⚠️
Your recent trades were REJECTED because you sold $932 but tried to buy $15,929.
This violates the fundamental law of conservation of capital.
BEFORE generating trades, manually verify:
  sum(SELL.quantity × SELL.price) = sum(BUY.amount)
If these don't match, your trades will be REJECTED by the system.

❌ WRONG FORMAT (what you're doing):
{
  "type": "BUY",
  "symbol": "GOOG", 
  "quantity": 0,        // ❌ DON'T include quantity for BUY trades
  "amount": 15611.71,   // ✅ This is correct
  "price": 245.36
}

✅ CORRECT FORMAT:
{
  "type": "BUY",
  "symbol": "GOOG",
  "amount": 15611.71,   // ✅ Only amount, no quantity field
  "price": 245.36
}

🚨 CRITICAL ERRORS YOU WERE MAKING:

1. WRONG STOCKS: You were suggesting trades for stocks NOT in CURRENT POSITIONS (like MU, AAPL).
   This is WRONG! You can ONLY trade stocks that are in the CURRENT POSITIONS list.

2. WRONG LOGIC: You were buying INTC (15.36% weight, target 15%) which is already at target!
   This is WRONG! You should NEVER buy more of a position that is already at or above target.

CORRECT APPROACH:
- Identify over-weighted positions (current_weight > target_weight) → SELL from these
- Identify under-weighted positions (current_weight < target_weight) → BUY for these
- Example: GOOG is 25.01% but target is 10% → SELL GOOG
- Example: AMD is 5.39% but target is 5% → NO TRADE (at target)

CURRENT MARKET PRICES (use these for ALL calculations):
${Object.entries(priceMap).map(([symbol, data]: [string, any]) => `${symbol}: $${data.price.toFixed(2)}`).join('\n')}

DEBUG: Price map contains ${Object.keys(priceMap).length} symbols: ${Object.keys(priceMap).join(', ')}

USER QUESTION:
${user_message}`;

    // 6. Check if this is a rebalancing request and use backend calculation
    const userMessageLower = user_message.toLowerCase();
    
    console.log(`DEBUG - User message: "${user_message}"`);
    console.log(`DEBUG - User message lower: "${userMessageLower}"`);
    
    // Only use backend for rebalancing operations, not for specific buy/sell requests
    const isRebalanceRequest = (userMessageLower.includes('rebalance') || 
                               userMessageLower.includes('balance') ||
                               userMessageLower.includes('equal') ||
                               userMessageLower.includes('same weight') ||
                               userMessageLower.includes('distribute')) &&
                               !userMessageLower.includes('buy') &&
                               !userMessageLower.includes('sell') &&
                               !userMessageLower.includes('vende') &&
                               !userMessageLower.includes('compra');

    console.log(`DEBUG - Is rebalance request: ${isRebalanceRequest}`);

    if (isRebalanceRequest) {
      console.log('DEBUG - Detected rebalancing request, using backend calculation');
      
      try {
        // Determine rebalance type - DEFAULT to equal weights
        let rebalanceType = 'equal_weights';
        if (userMessageLower.includes('target')) {
          rebalanceType = 'target_weights';
        }

        console.log(`DEBUG - Using rebalance type: ${rebalanceType}`);
        console.log(`DEBUG - Calling backend API for strategy: ${strategy.id}`);

        // Call backend rebalance API
        const rebalanceResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/strategies/${strategy.id}/rebalance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            strategyId: strategy.id,
            rebalanceType
          })
        });

        console.log(`DEBUG - Backend response status: ${rebalanceResponse.status}`);

        if (!rebalanceResponse.ok) {
          const errorText = await rebalanceResponse.text();
          console.error(`Backend rebalance failed: ${rebalanceResponse.status} - ${errorText}`);
          throw new Error(`Backend rebalance failed: ${rebalanceResponse.status} - ${errorText}`);
        }

        const rebalanceData = await rebalanceResponse.json();
        console.log(`DEBUG - Backend response data:`, JSON.stringify(rebalanceData, null, 2));
        
        if (!rebalanceData.success) {
          throw new Error(`Backend rebalance error: ${rebalanceData.error}`);
        }

        console.log(`DEBUG - Backend calculated ${rebalanceData.trades.length} trades`);

        // Return the backend-calculated trades with AI explanation
        const explanation = rebalanceType === 'equal_weights' 
          ? `I'll rebalance your portfolio to equal weights. Here are the calculated trades to achieve this:`
          : `I'll rebalance your portfolio to the target weights. Here are the calculated trades to achieve this:`;

        console.log(`DEBUG - Returning backend trades to frontend`);

        return NextResponse.json({
          message: explanation,
          trades: rebalanceData.trades,
          impact: {
            estimated_return_change: "Rebalancing will optimize your portfolio allocation",
            risk_change: "Risk-adjusted rebalancing based on target weights",
            expected_allocation: rebalanceData.summary
          }
        });

      } catch (error) {
        console.error('Backend rebalance error:', error);
        // Fall back to AI calculation if backend fails
        console.log('DEBUG - Backend rebalance failed, falling back to AI calculation');
        console.log('DEBUG - Error details:', error);
      }
    }

    // 6. Call OpenAI (for non-rebalancing requests or if backend fails)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chat_history,
        { role: 'user', content: user_message }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const aiData = JSON.parse(aiResponse);

    // 7. Validate and enrich trades with current prices
    const validatedTrades = (aiData.trades || []).map((trade: any) => {
      const currentPrice = priceMap[trade.symbol]?.price || trade.price || 0;
      
      // For BUY trades, ensure we have amount (not quantity)
      if (trade.type === 'BUY') {
        return {
          ...trade,
          price: currentPrice,
          amount: trade.amount || (trade.quantity * currentPrice), // Fallback if AI still sends quantity
          quantity: undefined // Remove quantity for BUY
        };
      }
      
      // For SELL trades, ensure we have quantity
      return {
        ...trade,
        price: currentPrice,
        amount: trade.quantity * currentPrice
      };
    });

    return NextResponse.json({
      message: aiData.message,
      trades: validatedTrades,
      impact: aiData.impact || {}
    });

  } catch (error) {
    console.error('Error in POST /api/ai/strategy-assistant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

