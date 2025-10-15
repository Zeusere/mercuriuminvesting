import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// System prompt for portfolio analysis
const ANALYZE_PORTFOLIO_PROMPT = `You are an expert investment portfolio analyst. Your task is to provide a comprehensive analysis of a given investment portfolio and offer actionable recommendations.

Analyze the portfolio based on:
1. **Diversification**: How well spread are the investments across sectors, market caps, and risk profiles?
2. **Risk Assessment**: What is the overall risk level? Are there any concentrated positions or high-volatility stocks?
3. **Performance Analysis**: Based on the provided metrics, how has each stock and the overall portfolio performed?
4. **Sector Exposure**: Is the portfolio overweight or underweight in certain sectors?
5. **Optimization Opportunities**: What changes could improve risk-adjusted returns?

**CRITICAL CONTEXT RULES:**
- **Identify the portfolio's theme/focus** by looking at current holdings (e.g., AI/tech, dividends, growth, semiconductors, etc.)
- **Stay within the theme**: ALL recommendations (increase, decrease, remove, add) MUST align with the portfolio's existing focus
- **For "add" recommendations**: ONLY suggest stocks from the SAME sector/theme as current holdings
- **Example**: If portfolio has NVDA, TSLA, GOOGL (tech/AI), DO NOT suggest JPM, JNJ, or other unrelated stocks
- **Example**: If portfolio focuses on high-growth tech, suggest MSFT, AMD, META - NOT defensive/dividend stocks
- **Maintain consistency**: Respect the investor's clear strategy evident in their current holdings

Return a JSON object with this EXACT structure:
{
  "portfolio_name": "Name of the portfolio",
  "overall_score": NUMBER (1-10, overall portfolio quality),
  "risk_level": "Low" | "Moderate" | "High" | "Very High",
  "diversification_score": NUMBER (1-10, how diversified),
  "analysis": "2-3 paragraph comprehensive analysis of the portfolio",
  "strengths": ["strength 1", "strength 2", ...] (3-5 key strengths),
  "weaknesses": ["weakness 1", "weakness 2", ...] (3-5 areas for improvement),
  "recommendations": [
    {
      "action": "increase" | "decrease" | "hold" | "remove" | "add",
      "symbol": "STOCK_SYMBOL",
      "current_weight": NUMBER (current % allocation, if applicable),
      "suggested_weight": NUMBER (suggested % allocation),
      "reason": "Detailed reason for this recommendation",
      "priority": "high" | "medium" | "low"
    }
  ] (3-8 specific actionable recommendations)
}

Guidelines:
- Be specific and actionable
- Base analysis on real data provided (performance, volatility, etc.)
- Consider both risk and return
- Provide constructive criticism
- Suggest realistic improvements within the portfolio's theme
- Prioritize recommendations by impact
- **NEVER suggest stocks from different sectors/themes than current holdings**

Only return valid JSON, no additional text.`

interface PortfolioStock {
  symbol: string
  weight: number
  name?: string
}

interface StockMetrics {
  symbol: string
  name: string
  price: number
  performance_ytd?: number
  performance_1y?: number
  performance_3m?: number
  volatility?: number
  volume?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const alpacaKey = process.env.ALPACA_API_KEY
    const alpacaSecret = process.env.ALPACA_API_SECRET

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!alpacaKey || !alpacaSecret) {
      return NextResponse.json(
        { error: 'Alpaca API keys not configured' },
        { status: 500 }
      )
    }

    const { portfolio_id, portfolio_name, stocks, total_amount } = await request.json()

    if (!portfolio_name || !stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio name and stocks array are required' },
        { status: 400 }
      )
    }

    console.log(`Analyzing portfolio: ${portfolio_name} with ${stocks.length} stocks`)

    // Step 1: Fetch current metrics for each stock
    const stockMetrics = await fetchStockMetrics(stocks, alpacaKey, alpacaSecret)

    console.log(`Fetched metrics for ${stockMetrics.length} stocks`)

    // Step 2: Prepare analysis prompt with real data
    const analysisPrompt = `
Portfolio to Analyze:
Name: ${portfolio_name}
Total Amount: $${total_amount || 10000}
Number of Stocks: ${stocks.length}

Current Holdings:
${JSON.stringify(stocks.map((s: PortfolioStock) => ({
  symbol: s.symbol,
  weight: s.weight,
  name: s.name || s.symbol
})), null, 2)}

Stock Performance Metrics (from Alpaca Markets):
${JSON.stringify(stockMetrics, null, 2)}

Portfolio Statistics:
- Total positions: ${stocks.length}
- Average weight: ${(100 / stocks.length).toFixed(2)}%
- Largest position: ${Math.max(...stocks.map((s: PortfolioStock) => s.weight)).toFixed(2)}%
- Smallest position: ${Math.min(...stocks.map((s: PortfolioStock) => s.weight)).toFixed(2)}%

Provide a comprehensive analysis with actionable recommendations.`

    // Step 3: Call OpenAI for analysis
    console.log('Calling OpenAI for portfolio analysis...')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYZE_PORTFOLIO_PROMPT },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    console.log('Analysis completed successfully')

    // Step 4: Return analysis
    return NextResponse.json({
      ...analysis,
      portfolio_id,
      analyzed_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error analyzing portfolio:', error)
    return NextResponse.json(
      { 
        error: 'Error analyzing portfolio',
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to fetch stock metrics from Alpaca
async function fetchStockMetrics(
  stocks: PortfolioStock[],
  alpacaKey: string,
  alpacaSecret: string
): Promise<StockMetrics[]> {
  const metrics: StockMetrics[] = []

  // Calculate date ranges
  const endDate = new Date()
  const startDate1Y = new Date()
  startDate1Y.setFullYear(endDate.getFullYear() - 1)

  const startDate3M = new Date()
  startDate3M.setMonth(endDate.getMonth() - 3)

  // Fetch metrics for each stock (in parallel for speed)
  const metricsPromises = stocks.map(async (stock) => {
    try {
      // Fetch 1-year historical data
      // Using split-adjusted prices to avoid distortion from stock splits
      const barsUrl = `https://data.alpaca.markets/v2/stocks/${stock.symbol}/bars?` +
        `start=${startDate1Y.toISOString()}&` +
        `end=${endDate.toISOString()}&` +
        `timeframe=1Day&` +
        `limit=1000&` +
        `feed=iex&` +
        `adjustment=split`

      const barsResponse = await fetch(barsUrl, {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      })

      if (!barsResponse.ok) {
        console.warn(`Failed to fetch bars for ${stock.symbol}`)
        return null
      }

      const barsData = await barsResponse.json()
      const bars = barsData.bars || []

      if (bars.length < 2) {
        console.warn(`Insufficient data for ${stock.symbol}`)
        return null
      }

      // Calculate metrics
      const firstBar = bars[0]
      const lastBar = bars[bars.length - 1]
      const currentPrice = lastBar.c

      // 1-year performance
      const performance_1y = ((lastBar.c - firstBar.c) / firstBar.c) * 100

      // 3-month performance
      const threeMonthsAgo = bars.find((bar: any) => {
        const barDate = new Date(bar.t)
        return barDate >= startDate3M
      })
      const performance_3m = threeMonthsAgo 
        ? ((lastBar.c - threeMonthsAgo.c) / threeMonthsAgo.c) * 100
        : performance_1y

      // YTD performance
      const yearStart = new Date(endDate.getFullYear(), 0, 1)
      const ytdBar = bars.find((bar: any) => {
        const barDate = new Date(bar.t)
        return barDate >= yearStart
      })
      const performance_ytd = ytdBar
        ? ((lastBar.c - ytdBar.c) / ytdBar.c) * 100
        : performance_1y

      // Volatility (standard deviation of returns)
      const returns: number[] = []
      for (let i = 1; i < bars.length; i++) {
        const dailyReturn = ((bars[i].c - bars[i - 1].c) / bars[i - 1].c) * 100
        returns.push(dailyReturn)
      }
      const avgReturn = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      const volatility = Math.sqrt(variance)

      // Average volume
      const avgVolume = bars.reduce((sum: number, bar: any) => sum + bar.v, 0) / bars.length

      return {
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: currentPrice,
        performance_ytd,
        performance_1y,
        performance_3m,
        volatility,
        volume: avgVolume
      }
    } catch (error) {
      console.error(`Error fetching metrics for ${stock.symbol}:`, error)
      return null
    }
  })

  const results = await Promise.all(metricsPromises)
  return results.filter(Boolean) as StockMetrics[]
}

