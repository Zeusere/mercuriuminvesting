import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// System prompt for extracting investment criteria
const EXTRACT_CRITERIA_PROMPT = `You are an investment advisor assistant. Extract structured investment criteria from user prompts.

IMPORTANT: Be SPECIFIC with sector names to avoid confusion:
- "Semiconductors" or "Semiconductor" = chip manufacturers and equipment (NVDA, AMD, INTC, TSM, ASML, etc.)
- "AI Software" or "Artificial Intelligence Software" = AI/ML software companies (PLTR, SOUN, BBAI, etc.)
- "Cloud Computing" or "SaaS" = cloud and software-as-a-service companies (MSFT, GOOGL, CRM, SNOW, etc.)
- "Fintech" = financial technology companies (COIN, SQ, PYPL, etc.)
- "Technology" (general) = all tech sectors combined

Return a JSON object with these fields:
- sectors: array of SPECIFIC sector names (be precise: use "Semiconductor" not just "Tech" if user mentions chips/semiconductors). Use empty array [] if no sector specified.
- focus: specific focus areas (e.g., "high growth", "fallen", "down", "caído", "decline", "dividend", "value", "stability")
  * IMPORTANT: If user asks for stocks that have "caído", "fallen", "bajado", "down", "lost value", use focus: "fallen" or "decline"
- metric: primary metric to optimize (e.g., "revenue_growth", "performance", "volatility", "market_cap")
- risk_level: "low", "moderate", or "high"
- timeframe: "1M", "3M", "6M", "1Y", "3Y", "5Y" for historical analysis (default to "1Y" if not specified)
- max_stocks: number (typically 5-12)
- min_price: minimum stock price (optional)
- max_price: maximum stock price (optional)

Example Input: "I want to invest in semiconductor companies with highest performance in the last year"
Example Output:
{
  "sectors": ["Semiconductor"],
  "focus": "high growth",
  "metric": "performance",
  "risk_level": "moderate",
  "timeframe": "1Y",
  "max_stocks": 10
}

Example Input: "I want AI software companies with best revenue growth"
Example Output:
{
  "sectors": ["AI Software"],
  "focus": "revenue growth",
  "metric": "revenue_growth",
  "risk_level": "moderate",
  "timeframe": "1Y",
  "max_stocks": 8
}

Example Input: "Quiero invertir en las empresas que más han caído este año"
Example Output:
{
  "sectors": [],
  "focus": "fallen",
  "metric": "performance",
  "risk_level": "high",
  "timeframe": "1Y",
  "max_stocks": 10
}

Only return valid JSON, no additional text.`

// System prompt for selecting stocks and assigning weights
const SELECT_STOCKS_PROMPT = `You are an expert portfolio manager. Based on the provided stock candidates and their metrics, select the best stocks and assign optimal weights.

CRITICAL RULES:
1. **USE REAL DATA**: The stock candidates provided have REAL performance data from Alpaca Markets. Use this data, not assumptions.
2. **Sector Specificity**: If the user asks for "semiconductors", ONLY select semiconductor companies (chip makers, chip equipment). DO NOT include AI software companies like Palantir (PLTR), SoundHound (SOUN), or BigBear.ai (BBAI) - these are AI SOFTWARE companies, NOT semiconductors.
3. **Sector Categories**:
   - Semiconductors: NVDA, AMD, INTC, TSM, ASML, QCOM, AVGO, MU, LRCX, KLAC, AMAT, etc. (chip manufacturing/equipment)
   - AI Software: PLTR, AI, SOUN, BBAI (artificial intelligence software/analytics)
   - Cloud/SaaS: MSFT, GOOGL, CRM, SNOW, NET (cloud computing, software-as-a-service)
   - Fintech: COIN, SQ, PYPL (financial technology)
4. **Performance Focus**:
   - If user wants "high growth" or "best performance": Select stocks with HIGHEST positive performance
   - If user wants "fallen", "caído", "decline", "down": Select stocks with LOWEST (most negative) performance
5. **Performance Metrics**: Strictly adhere to the user's requested metric and focus
6. **Diversification**: Within the SAME sector/category specified by user (or across all sectors if none specified)
7. **Weights**: Must sum to exactly 100%

Consider for selection:
- Does the stock match the EXACT sector requested (or any sector if none specified)?
- Performance metrics for the specified timeframe (use the REAL data provided)
- Risk/reward balance
- Volatility levels
- Company fundamentals and market position

Return a JSON object with:
- stocks: array of objects with:
  - symbol: string
  - weight: number (0-100, total must be 100)
  - reason: string (2-3 sentences explaining why this stock fits the SPECIFIC sector criteria and its performance metrics)
- summary: string (2-3 sentences about the overall portfolio strategy, emphasizing the sector focus)
- risk_assessment: string (brief risk level description)

Weights should sum to exactly 100.
Only return valid JSON, no additional text.`

interface InvestmentCriteria {
  sectors?: string[]
  focus?: string
  metric?: string
  risk_level?: string
  timeframe?: string
  max_stocks?: number
  min_price?: number
  max_price?: number
}

interface StockCandidate {
  symbol: string
  name: string
  price: number
  performance_1y?: number
  performance_ytd?: number
  performance_3m?: number
  volatility?: number
  volume?: number
  market_cap?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, total_amount = 10000, context = [] } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check for required API keys
    const openaiKey = process.env.OPENAI_API_KEY
    const alpacaKey = process.env.ALPACA_API_KEY
    const alpacaSecret = process.env.ALPACA_API_SECRET

    if (!openaiKey) {
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

    const openai = new OpenAI({ apiKey: openaiKey })

    // Step 1: Extract investment criteria using OpenAI
    console.log('Step 1: Extracting criteria from prompt...')
    const criteriaResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACT_CRITERIA_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const criteria: InvestmentCriteria = JSON.parse(
      criteriaResponse.choices[0].message.content || '{}'
    )
    console.log('Extracted criteria:', criteria)

    // Step 2: Search for stocks in Alpaca
    console.log('Step 2: Searching for stocks in Alpaca...')
    const candidates = await searchStocks(criteria, alpacaKey, alpacaSecret)
    console.log(`Found ${candidates.length} candidate stocks`)

    if (candidates.length === 0) {
      return NextResponse.json({
        message: 'No stocks found matching your criteria. Try adjusting your requirements.',
        stocks: [],
        summary: 'Unable to find suitable stocks.',
        risk_assessment: 'N/A',
        total_amount
      })
    }

    // Step 3: Calculate metrics for each candidate
    console.log('Step 3: Calculating metrics...')
    const candidatesWithMetrics = await enrichCandidatesWithMetrics(
      candidates,
      criteria,
      alpacaKey,
      alpacaSecret
    )

    // Step 4: Use OpenAI to select best stocks and assign weights
    console.log('Step 4: AI selecting optimal portfolio...')
    
    // Pass more candidates to AI for better selection (top 30 instead of 20)
    const candidatesToPass = Math.min(30, candidatesWithMetrics.length)
    
    const selectionPrompt = `
Investment Criteria:
${JSON.stringify(criteria, null, 2)}

Stock Candidates (top ${candidatesToPass} sorted by real Alpaca performance data):
${JSON.stringify(candidatesWithMetrics.slice(0, candidatesToPass), null, 2)}

Total Investment: $${total_amount}

IMPORTANT: These ${candidatesToPass} stocks are already sorted based on the criteria.
- If criteria.focus includes "fallen", "caído", "decline": The list is sorted WORST to BEST (most negative performance first)
- If criteria.focus includes "growth", "high performance": The list is sorted BEST to WORST (highest performance first)

Select the best ${criteria.max_stocks || 8} stocks from this list and assign optimal weights based on the investment criteria.`

    const selectionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SELECT_STOCKS_PROMPT },
        { role: 'user', content: selectionPrompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const selection = JSON.parse(
      selectionResponse.choices[0].message.content || '{}'
    )

    console.log('AI Selection Response:', JSON.stringify(selection, null, 2))

    // Validate selection has stocks
    if (!selection.stocks || !Array.isArray(selection.stocks) || selection.stocks.length === 0) {
      console.error('No stocks in selection:', selection)
      return NextResponse.json({
        message: 'The AI couldn\'t generate a valid portfolio. Please try with different criteria.',
        stocks: [],
        summary: 'Unable to create portfolio',
        risk_assessment: 'N/A',
        total_amount
      })
    }

    // Step 5: Enrich final stocks with full details
    const finalStocks = selection.stocks.map((stock: any) => {
      const candidate = candidatesWithMetrics.find(c => c.symbol === stock.symbol)
      return {
        symbol: stock.symbol,
        name: candidate?.name || stock.symbol,
        weight: stock.weight,
        reason: stock.reason,
        metrics: {
          performance_1y: candidate?.performance_1y,
          performance_ytd: candidate?.performance_ytd,
          performance_3m: candidate?.performance_3m,
          price: candidate?.price,
          volatility: candidate?.volatility,
          volume: candidate?.volume,
          market_cap: candidate?.market_cap
        }
      }
    })

    const response = {
      stocks: finalStocks,
      summary: selection.summary,
      risk_assessment: selection.risk_assessment,
      total_amount,
      criteria,
      ai_message: `I've analyzed ${candidatesWithMetrics.length} stocks and selected ${finalStocks.length} that best match your criteria.`
    }

    console.log('Final Response - Number of stocks:', finalStocks.length)
    console.log('Final Response - First stock:', finalStocks[0])

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error creating portfolio:', error)
    return NextResponse.json(
      { 
        error: 'Error creating portfolio',
        details: error?.message,
        message: 'Sorry, I encountered an error analyzing your request. Please try again with different criteria.'
      },
      { status: 500 }
    )
  }
}

// Search for stocks based on criteria
async function searchStocks(
  criteria: InvestmentCriteria,
  alpacaKey: string,
  alpacaSecret: string
): Promise<StockCandidate[]> {
  try {
    // Fetch all active US equity assets from Alpaca
    const response = await fetch(
      'https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity',
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status}`)
    }

    const assets = await response.json()

    // Categorized tech companies by sector
    const semiconductorStocks = [
      'NVDA', 'AMD', 'INTC', 'TSM', 'ASML', 'QCOM', 'AVGO', 'MU', 
      'LRCX', 'KLAC', 'AMAT', 'MRVL', 'ON', 'NXPI', 'MPWR', 'TXN',
      'ADI', 'MCHP', 'SWKS', 'SYNA', 'FORM', 'CRUS', 'SMTC', 'ICHR'
    ]
    
    const aiSoftwareStocks = [
      'PLTR', 'AI', 'PATH', 'SOUN', 'BBAI', 'AVAV', 'UPST', 'SYM', 'GFAI'
    ]
    
    const cloudSoftwareStocks = [
      'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'CRM', 'ORCL', 'ADBE', 'NOW', 
      'SNOW', 'NET', 'DDOG', 'MDB', 'TEAM', 'WDAY', 'PANW', 'CRWD', 
      'ZS', 'OKTA', 'SNPS', 'CDNS', 'ANSS', 'DOCN'
    ]
    
    const techGiantsStocks = [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NFLX'
    ]
    
    const fintechStocks = [
      'COIN', 'SQ', 'SHOP', 'PYPL', 'SOFI', 'AFRM', 'NU', 'HOOD'
    ]
    
    // Combine all for general tech queries
    const allTechStocks = [
      ...semiconductorStocks, 
      ...aiSoftwareStocks, 
      ...cloudSoftwareStocks, 
      ...techGiantsStocks, 
      ...fintechStocks
    ]

    // Common ETF patterns to exclude when looking for individual companies
    const etfPatterns = ['ETF', 'FUND', 'INDEX', 'TRUST']
    
    // Filter tradable assets - Use broad filtering and let Alpaca data determine the best matches
    let candidates = assets.filter((asset: any) => {
      if (!asset.tradable || asset.status !== 'active') return false
      if (asset.symbol.length > 5) return false // Avoid complex tickers
      if (asset.symbol.includes('-') || asset.symbol.includes('.')) return false // Avoid warrants/special shares
      
      // Exclude ETFs when looking for individual companies
      const assetName = (asset.name || '').toUpperCase()
      const isETF = etfPatterns.some(pattern => assetName.includes(pattern))
      if (isETF && criteria.focus !== 'etf') return false
      
      // If specific sectors are specified, do LIGHT filtering by name only
      // Don't limit to predefined lists - let Alpaca data determine the best stocks
      if (criteria.sectors && criteria.sectors.length > 0) {
        const sectorStr = criteria.sectors.join(' ').toLowerCase()
        const name = (asset.name || '').toLowerCase()
        
        // SEMICONDUCTOR filtering - by name patterns
        if (sectorStr.includes('semiconductor') || 
            (sectorStr.includes('chip') && !sectorStr.includes('microchip'))) {
          if (name.includes('semiconductor') || name.includes('chip') || 
              name.includes('micro') || name.includes('analog') ||
              name.includes('nvd') || name.includes('amd') || name.includes('intel') ||
              name.includes('qualcomm') || name.includes('broadcom') ||
              semiconductorStocks.includes(asset.symbol)) return true
          return false
        }
        
        // AI SOFTWARE filtering - by name patterns
        if ((sectorStr.includes('ai software') || sectorStr.includes('artificial intelligence software')) ||
            (sectorStr.includes('ai') && sectorStr.includes('software'))) {
          if (name.includes('artificial intelligence') || name.includes('ai') ||
              name.includes('machine learning') || name.includes('data analytics') ||
              aiSoftwareStocks.includes(asset.symbol)) return true
          return false
        }
        
        // CLOUD/SOFTWARE filtering - by name patterns
        if (sectorStr.includes('cloud') || sectorStr.includes('software') || sectorStr.includes('saas')) {
          if (name.includes('cloud') || name.includes('software') || 
              name.includes('platform') || name.includes('cyber') ||
              name.includes('data') || cloudSoftwareStocks.includes(asset.symbol)) return true
          return false
        }
        
        // FINTECH filtering - by name patterns
        if (sectorStr.includes('fintech') || sectorStr.includes('financial tech')) {
          if (name.includes('payment') || name.includes('crypto') || 
              name.includes('financial') || name.includes('bank') ||
              fintechStocks.includes(asset.symbol)) return true
          return false
        }
        
        // General TECH query - broader filter
        if (sectorStr.includes('tech') && !sectorStr.includes('semiconductor') && 
            !sectorStr.includes('cloud') && !sectorStr.includes('fintech')) {
          if (name.includes('tech') || name.includes('software') || 
              name.includes('cloud') || name.includes('data') || 
              name.includes('digital') || name.includes('internet') ||
              allTechStocks.includes(asset.symbol)) return true
          return false
        }
      }
      
      // If no sector filter, include all tradable stocks (we'll filter by performance later)
      return true
    })

    // If we filtered for tech/AI and got results, use those
    // Otherwise use general list
    if (candidates.length === 0) {
      candidates = assets.filter((asset: any) => 
        asset.tradable && 
        asset.status === 'active' &&
        asset.symbol.length <= 5 &&
        !asset.symbol.includes('-') &&
        !asset.symbol.includes('.')
      )
    }

    // Simple sorting - prefer known stocks but don't limit to them
    candidates.sort((a: any, b: any) => {
      // Prefer well-known stocks slightly, but still include others
      const aIsKnown = allTechStocks.includes(a.symbol)
      const bIsKnown = allTechStocks.includes(b.symbol)
      
      // Give slight preference to known stocks (they appear first)
      if (aIsKnown && !bIsKnown) return -1
      if (!aIsKnown && bIsKnown) return 1
      
      // Otherwise sort by symbol length (shorter = more established typically)
      return a.symbol.length - b.symbol.length
    })

    // Increase limit significantly to get more diverse candidates
    // The real filtering will happen based on Alpaca performance data
    candidates = candidates.slice(0, 300)

    console.log(`Selected ${candidates.length} candidate stocks for analysis`)
    console.log('First 10 candidates:', candidates.slice(0, 10).map((a: any) => a.symbol).join(', '))

    return candidates.map((asset: any) => ({
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      price: 0, // Will be fetched later
      exchange: asset.exchange
    }))

  } catch (error) {
    console.error('Error searching stocks:', error)
    return []
  }
}

// Enrich candidates with performance metrics
async function enrichCandidatesWithMetrics(
  candidates: StockCandidate[],
  criteria: InvestmentCriteria,
  alpacaKey: string,
  alpacaSecret: string
): Promise<StockCandidate[]> {
  const timeframe = criteria.timeframe || '1Y'
  
  // Calculate date range based on timeframe
  const endDate = new Date()
  const startDate = new Date()
  let barsTimeframe = '1Day'
  
  switch (timeframe) {
    case '1M': 
      startDate.setMonth(endDate.getMonth() - 1)
      barsTimeframe = '1Day'
      break
    case '3M': 
      startDate.setMonth(endDate.getMonth() - 3)
      barsTimeframe = '1Day'
      break
    case '6M': 
      startDate.setMonth(endDate.getMonth() - 6)
      barsTimeframe = '1Day'
      break
    case '1Y': 
      startDate.setFullYear(endDate.getFullYear() - 1)
      barsTimeframe = '1Day'
      break
    case '3Y': 
      startDate.setFullYear(endDate.getFullYear() - 3)
      barsTimeframe = '1Week'
      break
    case '5Y': 
      startDate.setFullYear(endDate.getFullYear() - 5)
      barsTimeframe = '1Week'
      break
    default: 
      startDate.setFullYear(endDate.getFullYear() - 1)
      barsTimeframe = '1Day'
  }

  console.log(`Fetching historical data from ${startDate.toISOString()} to ${endDate.toISOString()}`)
  
  const enrichedResults: StockCandidate[] = []

  // Process in batches of 15 to get more data points
  const batchSize = 15
  // Increase from 50 to 150 to analyze more stocks and get better results
  const maxToProcess = Math.min(candidates.length, 150)
  
  console.log(`Processing ${maxToProcess} stocks to get real performance data...`)
  
  for (let i = 0; i < maxToProcess; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${i}-${Math.min(i + batchSize, maxToProcess)} of ${maxToProcess})...`)
    
    const batchPromises = batch.map(async (candidate) => {
      try {
        // Fetch historical bars for this stock
        const barsUrl = `https://data.alpaca.markets/v2/stocks/${candidate.symbol}/bars?` + 
          `start=${startDate.toISOString()}&` +
          `end=${endDate.toISOString()}&` +
          `timeframe=${barsTimeframe}&` +
          `limit=1000&` +
          `feed=iex`

        const barsResponse = await fetch(barsUrl, {
          headers: {
            'APCA-API-KEY-ID': alpacaKey,
            'APCA-API-SECRET-KEY': alpacaSecret,
          },
        })

        if (!barsResponse.ok) {
          console.log(`Failed to fetch bars for ${candidate.symbol}`)
          return null
        }

        const barsData = await barsResponse.json()
        const bars = barsData.bars || []

        if (bars.length < 2) {
          console.log(`Insufficient data for ${candidate.symbol}`)
          return null
        }

        // Get first and last bar
        const firstBar = bars[0]
        const lastBar = bars[bars.length - 1]

        const startPrice = firstBar.c
        const endPrice = lastBar.c
        const currentPrice = endPrice

        // Calculate actual performance for the period
        const performance = ((endPrice - startPrice) / startPrice) * 100

        // Calculate volatility (standard deviation of returns)
        const returns = []
        for (let j = 1; j < bars.length; j++) {
          const dailyReturn = ((bars[j].c - bars[j - 1].c) / bars[j - 1].c) * 100
          returns.push(dailyReturn)
        }
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
        const volatility = Math.sqrt(variance)

        // Calculate average volume
        const avgVolume = bars.reduce((sum: number, bar: any) => sum + bar.v, 0) / bars.length

        return {
          ...candidate,
          price: currentPrice,
          performance_ytd: performance,
          performance_1y: performance,
          performance_3m: performance,
          volatility: volatility,
          volume: avgVolume
        }

      } catch (error) {
        console.error(`Error processing ${candidate.symbol}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    enrichedResults.push(...batchResults.filter(Boolean) as StockCandidate[])
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < maxToProcess) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }

  console.log(`Successfully enriched ${enrichedResults.length} stocks with historical data from Alpaca`)

  // CRITICAL: Sort by REAL performance data from Alpaca
  // This ensures we get the actual best/worst performers, not predetermined lists
  if (criteria.metric === 'performance' || criteria.metric === 'revenue_growth') {
    enrichedResults.sort((a, b) => (b.performance_ytd || 0) - (a.performance_ytd || 0))
  }
  
  // If user wants stocks that have FALLEN (negative performance), sort ascending
  if (criteria.focus && (criteria.focus.includes('caído') || criteria.focus.includes('fallen') || 
      criteria.focus.includes('down') || criteria.focus.includes('lost') || criteria.focus.includes('decline'))) {
    console.log('User wants stocks that have fallen - sorting by worst performance')
    enrichedResults.sort((a, b) => (a.performance_ytd || 0) - (b.performance_ytd || 0))
  }

  // Log top/bottom performers for debugging
  console.log('Top 10 by performance:', enrichedResults.slice(0, 10).map(s => ({
    symbol: s.symbol,
    name: s.name,
    performance: s.performance_ytd?.toFixed(2) + '%'
  })))
  
  console.log('Bottom 10 by performance:', enrichedResults.slice(-10).reverse().map(s => ({
    symbol: s.symbol,
    name: s.name,
    performance: s.performance_ytd?.toFixed(2) + '%'
  })))

  return enrichedResults

}
