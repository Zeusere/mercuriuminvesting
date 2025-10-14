import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// Simulador de broker - En producción esto se conectaría a la API real del broker
class BrokerSimulator {
  async executeOrder(order: any) {
    // Simular delay de ejecución
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simular precio de ejecución (precio de mercado simulado)
    const basePrice = this.getSimulatedPrice(order.symbol)
    const executionPrice = order.price || basePrice + (Math.random() - 0.5) * 2

    // Simular resultado de la orden
    const success = Math.random() > 0.05 // 95% de éxito

    return {
      success,
      broker_order_id: `BRK-${uuidv4().substring(0, 8)}`,
      execution_price: executionPrice,
      executed_at: new Date().toISOString(),
      status: success ? 'FILLED' : 'REJECTED',
      message: success 
        ? `Orden ejecutada exitosamente a ${executionPrice.toFixed(2)}`
        : 'Orden rechazada por el broker (simulado)',
    }
  }

  private getSimulatedPrice(symbol: string): number {
    // Precios simulados para símbolos comunes
    const prices: Record<string, number> = {
      'PLTR': 25.50,
      'AAPL': 175.30,
      'TSLA': 242.80,
      'MSFT': 378.90,
      'GOOGL': 138.40,
      'AMZN': 145.20,
      'NVDA': 495.60,
      'META': 312.40,
    }

    return prices[symbol] || 100.00
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    // Obtener la orden
    const { data: order, error: fetchError } = await supabase
      .from('trading_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order cannot be executed. Current status: ' + order.status },
        { status: 400 }
      )
    }

    // Ejecutar orden en el broker (simulado)
    const broker = new BrokerSimulator()
    const result = await broker.executeOrder(order)

    // Actualizar orden con resultado
    const { data: updatedOrder, error: updateError } = await supabase
      .from('trading_orders')
      .update({
        status: result.status,
        broker_order_id: result.broker_order_id,
        execution_price: result.execution_price,
        executed_at: result.executed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: result.success,
      order: updatedOrder,
      message: result.message,
    })
  } catch (error) {
    console.error('Error executing order:', error)
    return NextResponse.json(
      { error: 'Error executing order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

