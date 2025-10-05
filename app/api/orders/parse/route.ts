import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OrderParseResult } from '@/types/trading'

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })
}

const SYSTEM_PROMPT = `Eres un asistente experto en trading que convierte instrucciones en lenguaje natural a órdenes de trading estructuradas.

Analiza la instrucción del usuario y extrae:
1. SYMBOL: El símbolo o nombre de la acción (ej: PLTR para Palantir, AAPL para Apple, TSLA para Tesla)
2. SIDE: BUY (comprar) o SELL (vender)
3. TYPE: MARKET (mercado), LIMIT (límite), STOP_LOSS, TAKE_PROFIT
4. QUANTITY: Número de acciones
5. AMOUNT: Cantidad en euros/dólares a invertir
6. PRICE: Precio límite si es orden LIMIT
7. STOP_LOSS: Si menciona stop loss, cuánto (en euros/dólares o porcentaje)
8. TAKE_PROFIT: Si menciona take profit o beneficio objetivo

Ejemplos:
- "Comprar Palantir, pero si pierdo 1000 euros cerrar" → BUY PLTR, MARKET, STOP_LOSS: 1000 EUR
- "Vender 50 acciones de Apple a 150 dólares" → SELL AAPL, LIMIT, quantity: 50, price: 150
- "Comprar Tesla por 5000 euros con stop loss del 10%" → BUY TSLA, MARKET, amount: 5000, STOP_LOSS: 10%

Responde SOLO con un JSON válido con esta estructura:
{
  "symbol": "SÍMBOLO",
  "side": "BUY o SELL",
  "type": "MARKET, LIMIT, STOP_LOSS o TAKE_PROFIT",
  "quantity": número o null,
  "amount": número o null,
  "price": número o null,
  "stop_loss": { "type": "FIXED o PERCENTAGE", "value": número } o null,
  "take_profit": { "type": "FIXED o PERCENTAGE", "value": número } o null,
  "confidence": 0-100,
  "interpretation": "explicación de lo que entendiste"
}`

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          fallback: true,
          order: parseFallback(input)
        },
        { status: 200 }
      )
    }

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    const parseResult: OrderParseResult = {
      success: true,
      order: {
        symbol: result.symbol?.toUpperCase(),
        side: result.side,
        type: result.type,
        quantity: result.quantity,
        amount: result.amount,
        price: result.price,
        stop_loss: result.stop_loss,
        take_profit: result.take_profit,
        raw_input: input,
        parsed_intent: result.interpretation || input,
      },
      confidence: result.confidence || 85,
      interpretation: result.interpretation || 'Orden procesada correctamente',
    }

    return NextResponse.json(parseResult)
  } catch (error) {
    console.error('Error parsing order:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error processing order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Fallback parser sin AI para cuando no hay API key configurada
function parseFallback(input: string): Partial<OrderParseResult['order']> {
  const lowerInput = input.toLowerCase()
  
  // Detectar símbolo común
  const symbols = ['pltr', 'aapl', 'tsla', 'msft', 'googl', 'amzn', 'nvda', 'meta']
  const symbol = symbols.find(s => lowerInput.includes(s))
  
  // Detectar compra/venta
  const side = lowerInput.includes('vender') || lowerInput.includes('sell') ? 'SELL' : 'BUY'
  
  // Detectar stop loss
  const stopLossMatch = lowerInput.match(/(?:perd|stop|loss).*?(\d+)/)
  const stopLoss = stopLossMatch ? {
    type: 'FIXED' as const,
    value: parseInt(stopLossMatch[1])
  } : undefined

  return {
    symbol: symbol?.toUpperCase() || 'UNKNOWN',
    side: side as 'BUY' | 'SELL',
    type: 'MARKET',
    stop_loss: stopLoss,
    raw_input: input,
    parsed_intent: 'Procesado con parser básico (configura OpenAI API key para mejor precisión)',
  }
}

