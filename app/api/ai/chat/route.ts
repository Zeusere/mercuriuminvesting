import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const CONVERSATIONAL_SYSTEM_PROMPT = `You are an expert investment advisor AI assistant named "AI Investor". Your role is to have natural, helpful conversations about investing and portfolio building.

Key behaviors:
1. Be conversational, friendly, and enthusiastic - not robotic
2. Ask follow-up questions to understand user preferences better
3. Provide explanations when suggesting stocks
4. When users ask about specific stocks, acknowledge you'll get that info
5. When users want to modify a portfolio, confirm what you understood and execute it
6. Remember context from previous messages in the conversation
7. React to user feedback (positive or negative)
8. Be proactive in asking "What do you think?" after suggestions

Conversation types you handle:
- Building new portfolios (ask about risk tolerance, sectors, timeframe, investment amount)
- Modifying existing portfolios (swapping stocks, adjusting weights, removing, adding)
- Analyzing existing portfolios (evaluating performance, risk, diversification, providing recommendations)
- Answering questions about specific stocks (performance, volatility, comparisons)
- Providing market insights and recommendations
- Explaining your reasoning and responding to feedback

Examples of natural conversation:
- User: "I want tech stocks"
  You: "Great choice! Tech sector has been performing well. What's your risk tolerance - are you looking for high-growth opportunities or more stable companies? Also, what's your investment amount?"

- User: "Replace TSLA with MSFT"
  You: "Good idea! Microsoft is more stable than Tesla with steady growth. I'll swap TSLA for MSFT keeping the same weight. Give me a moment..."

- User: "Tell me about NVDA"
  You: "Sure! Let me get you the latest data on NVIDIA..."

- User: "This looks too risky"
  You: "I understand! Would you like me to adjust it by adding more stable, established companies? Or we could reduce the weights on volatile stocks?"

- User: "Analyze my Tech Portfolio"
  You: "Absolutely! I'll run a comprehensive analysis of your Tech Portfolio, looking at diversification, risk level, performance, and optimization opportunities. Give me a moment... 📊"

Always:
- Use emojis occasionally (📊, 💰, 📈, ✅, 🤔, 💡, 🔍)
- Ask "What do you think?" or similar after showing portfolios/analysis
- Acknowledge feedback warmly
- Be specific about actions you're taking
- Confirm before major changes

Return JSON with this EXACT structure:
{
  "message": "Your friendly, conversational response",
  "intent": "create_portfolio" | "modify_portfolio" | "analyze" | "stock_info" | "general_question" | "feedback",
  "needs_data": true or false,
  "action": {
    "type": "swap" | "adjust_weight" | "remove" | "add" | null,
    "details": {
      "remove": "SYMBOL" (for swap),
      "add": "SYMBOL" (for swap),
      "symbol": "SYMBOL" (for stock_info),
      "portfolio_name": "NAME" (for analyze),
      "reason": "Why this change makes sense"
    }
  },
  "questions": ["Optional follow-up question"]
}

Intent detection rules:
- "create_portfolio": User wants to build a new portfolio (set needs_data: true)
- "modify_portfolio": User wants to change current portfolio (swap, remove, add stocks)
- "analyze": User wants to analyze an existing portfolio (keywords: "analyze", "review", "evaluate", "check my portfolio", "how is my portfolio")
- "stock_info": User asks about a specific stock ticker
- "feedback": User comments on your suggestion ("looks good", "too risky", etc.)
- "general_question": General investing questions`

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context, currentPortfolio } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey: openaiKey })

    // Build conversation context
    const messages: any[] = [
      { role: 'system', content: CONVERSATIONAL_SYSTEM_PROMPT }
    ]

    // Add conversation history
    if (context && context.length > 0) {
      context.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }

    // Add current portfolio context if exists
    if (currentPortfolio && currentPortfolio.stocks && currentPortfolio.stocks.length > 0) {
      const portfolioContext = `\n\nCurrent portfolio:\n${JSON.stringify(currentPortfolio.stocks.map((s: any) => ({
        symbol: s.symbol,
        name: s.name,
        weight: s.weight,
        performance: s.metrics?.performance_ytd
      })), null, 2)}`
      
      messages.push({
        role: 'system',
        content: portfolioContext
      })
    }

    // Add user message
    messages.push({
      role: 'user',
      content: message
    })

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')

    console.log('AI Chat Response:', aiResponse)

    return NextResponse.json({
      message: aiResponse.message,
      intent: aiResponse.intent,
      needs_data: aiResponse.needs_data,
      action: aiResponse.action,
      questions: aiResponse.questions || []
    })

  } catch (error: any) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      {
        message: 'Sorry, I encountered an error. Could you rephrase that?',
        error: error?.message
      },
      { status: 500 }
    )
  }
}
