import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { message, context, portfolio } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Preparar el contexto del portfolio real para el AI
    const portfolioSummary = portfolio ? `

📊 **REAL PORTFOLIO CONTEXT**

**Portfolio Summary:**
- Total Value: $${portfolio.summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Gain/Loss: ${portfolio.summary.totalGainLoss >= 0 ? '+' : ''}$${portfolio.summary.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${portfolio.summary.totalGainLossPercent.toFixed(2)}%)
- Number of Holdings: ${portfolio.summary.uniqueSecurities}

**Current Holdings:**
${portfolio.holdings.map((h: any) => `
- ${h.symbol} (${h.name})
  - Quantity: ${h.quantity.toFixed(2)}
  - Current Value: $${h.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  - Cost Basis: $${h.costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  - Gain/Loss: ${h.gainLoss >= 0 ? '+' : ''}$${h.gainLoss.toFixed(2)} (${h.gainLossPercent.toFixed(2)}%)
  - Portfolio Weight: ${h.weight.toFixed(2)}%
`).join('')}

` : ''

    // Construir el historial de mensajes para OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert AI Investment Advisor specializing in portfolio analysis and optimization. You are analyzing a REAL brokerage portfolio connected via Plaid.

Your capabilities include:
1. **Portfolio Analysis**: Assess risk, diversification, sector allocation, and overall health
2. **Rebalancing Recommendations**: Suggest optimal allocation adjustments
3. **Stock Deep Dives**: Provide detailed analysis of individual holdings
4. **Tax Optimization**: Identify tax loss harvesting opportunities
5. **Performance Review**: Compare portfolio performance vs benchmarks (S&P 500, etc.)
6. **Risk Assessment**: Evaluate portfolio volatility and risk metrics
7. **Sector Analysis**: Analyze sector exposure and concentration risk
8. **Dividend Analysis**: Review dividend yield and income potential

Guidelines:
- Be professional, insightful, and data-driven
- Provide actionable recommendations
- Use emojis sparingly for visual clarity
- Format responses with markdown for readability
- Consider tax implications when suggesting trades
- Highlight both strengths and areas for improvement
- Reference specific stocks and metrics from the portfolio
- Be honest about risks and limitations

${portfolioSummary}`
      }
    ]

    // Agregar historial de conversación
    if (context && Array.isArray(context)) {
      context.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        }
      })
    }

    // Agregar el mensaje actual del usuario
    messages.push({
      role: 'user',
      content: message
    })

    // Definir funciones especializadas para el AI
    const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
      {
        name: 'analyze_portfolio_diversification',
        description: 'Analyze portfolio diversification across sectors, asset types, and concentration risk',
        parameters: {
          type: 'object',
          properties: {
            analysis_type: {
              type: 'string',
              enum: ['sector', 'concentration', 'overall'],
              description: 'Type of diversification analysis to perform'
            }
          },
          required: ['analysis_type']
        }
      },
      {
        name: 'identify_tax_opportunities',
        description: 'Identify tax loss harvesting opportunities and tax-efficient strategies',
        parameters: {
          type: 'object',
          properties: {
            min_loss_threshold: {
              type: 'number',
              description: 'Minimum loss percentage to consider for tax harvesting (default: -5%)'
            }
          }
        }
      },
      {
        name: 'suggest_rebalancing',
        description: 'Suggest portfolio rebalancing to optimize allocation and reduce risk',
        parameters: {
          type: 'object',
          properties: {
            target_allocation: {
              type: 'string',
              enum: ['conservative', 'moderate', 'aggressive', 'custom'],
              description: 'Target risk profile for rebalancing'
            }
          },
          required: ['target_allocation']
        }
      },
      {
        name: 'compare_vs_benchmark',
        description: 'Compare portfolio performance vs market benchmarks (S&P 500, NASDAQ, etc.)',
        parameters: {
          type: 'object',
          properties: {
            benchmark: {
              type: 'string',
              enum: ['SPY', 'QQQ', 'DIA', 'IWM'],
              description: 'Benchmark ETF to compare against'
            }
          },
          required: ['benchmark']
        }
      },
      {
        name: 'analyze_stock_fundamentals',
        description: 'Deep dive analysis of a specific stock in the portfolio',
        parameters: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol to analyze'
            }
          },
          required: ['symbol']
        }
      }
    ]

    // Llamar a OpenAI con function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseMessage = completion.choices[0]?.message

    // Si el AI quiere llamar a una función
    if (responseMessage?.function_call) {
      const functionName = responseMessage.function_call.name
      const functionArgs = JSON.parse(responseMessage.function_call.arguments || '{}')

      let functionResponse = ''

      // Ejecutar la función solicitada
      switch (functionName) {
        case 'analyze_portfolio_diversification':
          functionResponse = analyzeDiversification(portfolio, functionArgs.analysis_type)
          break
        case 'identify_tax_opportunities':
          functionResponse = identifyTaxOpportunities(portfolio, functionArgs.min_loss_threshold || -5)
          break
        case 'suggest_rebalancing':
          functionResponse = suggestRebalancing(portfolio, functionArgs.target_allocation)
          break
        case 'compare_vs_benchmark':
          functionResponse = `📊 To compare vs ${functionArgs.benchmark}, I would need real-time market data. However, based on your current portfolio composition and ${portfolio.summary.totalGainLossPercent.toFixed(2)}% return, I can provide insights on your performance.`
          break
        case 'analyze_stock_fundamentals':
          functionResponse = `🔍 For a deep dive on ${functionArgs.symbol}, I recommend checking recent earnings, P/E ratio, growth metrics, and analyst ratings. Your current position shows ${portfolio.holdings.find((h: any) => h.symbol === functionArgs.symbol)?.gainLossPercent.toFixed(2) || 'N/A'}% gain/loss.`
          break
        default:
          functionResponse = 'Function not implemented'
      }

      // Enviar la respuesta de la función de vuelta al AI
      messages.push(responseMessage)
      messages.push({
        role: 'function',
        name: functionName,
        content: functionResponse
      })

      // Obtener respuesta final del AI
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      })

      const aiResponse = secondCompletion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'

      return NextResponse.json({
        message: aiResponse,
        function_called: functionName,
        usage: secondCompletion.usage
      })
    }

    // Respuesta directa sin function calling
    const aiResponse = responseMessage?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'

    return NextResponse.json({
      message: aiResponse,
      usage: completion.usage
    })

  } catch (error: any) {
    console.error('Error in analyze-real-portfolio:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze portfolio',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper functions for portfolio analysis

function analyzeDiversification(portfolio: any, analysisType: string): string {
  const holdings = portfolio.holdings || []
  
  if (analysisType === 'concentration') {
    // Analizar concentración
    const topHoldings = holdings
      .sort((a: any, b: any) => b.weight - a.weight)
      .slice(0, 5)
    
    const top5Weight = topHoldings.reduce((sum: number, h: any) => sum + h.weight, 0)
    
    return `📊 **Concentration Analysis:**

**Top 5 Holdings:** ${top5Weight.toFixed(2)}% of portfolio
${topHoldings.map((h: any, i: number) => `${i + 1}. ${h.symbol}: ${h.weight.toFixed(2)}%`).join('\n')}

**Risk Level:** ${top5Weight > 50 ? '⚠️ HIGH - Consider diversifying' : top5Weight > 30 ? '⚡ MODERATE' : '✅ LOW - Well diversified'}

**Recommendation:** ${top5Weight > 50 ? 'Your portfolio is heavily concentrated. Consider reducing positions in top holdings.' : 'Good diversification across holdings.'}`
  }
  
  if (analysisType === 'sector') {
    return `📊 **Sector Analysis:**

Based on your ${holdings.length} holdings, I recommend analyzing sector exposure. Common sectors include:
- Technology
- Healthcare
- Financial Services
- Consumer Goods
- Energy

Consider ensuring no single sector exceeds 30-40% of your portfolio.`
  }
  
  return `📊 **Overall Diversification:**

- **Number of Holdings:** ${holdings.length}
- **Diversification Score:** ${holdings.length >= 15 ? '✅ Excellent' : holdings.length >= 10 ? '⚡ Good' : '⚠️ Consider adding more positions'}

**Recommendations:**
${holdings.length < 10 ? '- Add more holdings to reduce single-stock risk' : '- Maintain current diversification level'}
- Review sector allocation
- Consider international exposure
- Balance growth vs value stocks`
}

function identifyTaxOpportunities(portfolio: any, minLossThreshold: number): string {
  const holdings = portfolio.holdings || []
  const losers = holdings.filter((h: any) => h.gainLossPercent < minLossThreshold)
  
  if (losers.length === 0) {
    return `💰 **Tax Loss Harvesting Analysis:**

✅ **No significant losses found** (threshold: ${minLossThreshold}%)

All your holdings are performing at or above the threshold. This is great for returns but limits tax loss harvesting opportunities.

**Alternative Strategies:**
- Consider tax-efficient fund placement
- Review dividend tax implications
- Plan for long-term capital gains (hold >1 year)`
  }
  
  const totalLosses = losers.reduce((sum: any, h: any) => sum + h.gainLoss, 0)
  
  return `💰 **Tax Loss Harvesting Opportunities:**

**Potential Tax Savings:** ~$${Math.abs(totalLosses * 0.25).toFixed(2)} (assuming 25% tax rate)

**Positions to Consider:**
${losers.map((h: any) => `
- **${h.symbol}**: ${h.gainLossPercent.toFixed(2)}% loss ($${Math.abs(h.gainLoss).toFixed(2)})
  - Current Value: $${h.value.toFixed(2)}
  - Cost Basis: $${h.costBasis.toFixed(2)}
`).join('')}

**Strategy:**
1. Sell losing positions before year-end
2. Harvest losses to offset capital gains
3. Consider wash sale rules (wait 30 days to rebuy)
4. Reinvest in similar but not identical securities

⚠️ **Important:** Consult with a tax professional before executing tax loss harvesting strategies.`
}

function suggestRebalancing(portfolio: any, targetAllocation: string): string {
  const holdings = portfolio.holdings || []
  const totalValue = portfolio.summary.totalValue
  
  let targetWeights: { [key: string]: number } = {}
  
  switch (targetAllocation) {
    case 'conservative':
      targetWeights = { 'equal': 100 / holdings.length }
      break
    case 'moderate':
      targetWeights = { 'equal': 100 / holdings.length }
      break
    case 'aggressive':
      targetWeights = { 'equal': 100 / holdings.length }
      break
    default:
      targetWeights = { 'equal': 100 / holdings.length }
  }
  
  const equalWeight = 100 / holdings.length
  const rebalanceNeeded = holdings.filter((h: any) => Math.abs(h.weight - equalWeight) > 2)
  
  return `⚖️ **Rebalancing Recommendations (${targetAllocation.toUpperCase()}):**

**Target:** Equal weight (~${equalWeight.toFixed(2)}% per position)

**Positions Needing Adjustment:**
${rebalanceNeeded.map((h: any) => {
  const diff = h.weight - equalWeight
  const action = diff > 0 ? 'REDUCE' : 'INCREASE'
  const amount = Math.abs((diff / 100) * totalValue)
  return `
- **${h.symbol}**: Currently ${h.weight.toFixed(2)}% → Target ${equalWeight.toFixed(2)}%
  - Action: ${action} by $${amount.toFixed(2)} (${Math.abs(diff).toFixed(2)}%)
  - ${diff > 0 ? 'Sell' : 'Buy'} ~${Math.abs(amount / h.value * h.quantity).toFixed(2)} shares`
}).join('')}

${rebalanceNeeded.length === 0 ? '✅ **Portfolio is well-balanced!** No major adjustments needed.' : ''}

**Benefits of Rebalancing:**
- Maintain target risk level
- Take profits from winners
- Buy dips in underperformers
- Reduce concentration risk

💡 **Tip:** Rebalance quarterly or when positions drift >5% from target.`
}


