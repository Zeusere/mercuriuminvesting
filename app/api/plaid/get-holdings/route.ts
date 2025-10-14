import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/plaid/get-holdings?connection_id=xxx
 * Obtiene los holdings sincronizados de una conexión
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connection_id')

    // Si no se especifica connection_id, devolver todos los holdings del usuario
    let query = supabase
      .from('real_holdings')
      .select(`
        *,
        plaid_accounts (
          account_name,
          account_type,
          balance_current,
          plaid_connections (
            institution_name,
            last_synced_at
          )
        )
      `)
      .eq('user_id', user.id)
      .order('value', { ascending: false })

    if (connectionId) {
      query = query.eq('connection_id', connectionId)
    }

    const { data: holdings, error } = await query

    if (error) {
      console.error('Error fetching holdings:', error)
      throw error
    }

    // Calcular métricas del portfolio
    const totalValue = holdings?.reduce((sum, h) => sum + (h.value || 0), 0) || 0
    const totalCostBasis = holdings?.reduce((sum, h) => sum + (h.cost_basis || 0), 0) || 0
    const totalGainLoss = totalValue - totalCostBasis
    const totalGainLossPercent = totalCostBasis > 0 
      ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 
      : 0

    // Agrupar por símbolo (en caso de tener la misma acción en múltiples cuentas)
    const holdingsBySymbol = holdings?.reduce((acc: any, holding: any) => {
      const symbol = holding.symbol || 'UNKNOWN'
      if (!acc[symbol]) {
        acc[symbol] = {
          symbol,
          name: holding.name,
          type: holding.type,
          total_quantity: 0,
          total_value: 0,
          total_cost_basis: 0,
          weighted_avg_price: 0,
          accounts: [],
        }
      }

      acc[symbol].total_quantity += holding.quantity || 0
      acc[symbol].total_value += holding.value || 0
      acc[symbol].total_cost_basis += holding.cost_basis || 0
      acc[symbol].accounts.push({
        account_name: holding.plaid_accounts?.account_name,
        quantity: holding.quantity,
        value: holding.value,
      })

      return acc
    }, {})

    const consolidatedHoldings = Object.values(holdingsBySymbol || {}).map((h: any) => ({
      ...h,
      weighted_avg_price: h.total_quantity > 0 ? h.total_value / h.total_quantity : 0,
      gain_loss: h.total_value - h.total_cost_basis,
      gain_loss_percent: h.total_cost_basis > 0 
        ? ((h.total_value - h.total_cost_basis) / h.total_cost_basis) * 100 
        : 0,
      weight_percent: totalValue > 0 ? (h.total_value / totalValue) * 100 : 0,
    }))

    // Obtener información de la última sincronización
    let lastSync = null
    if (holdings && holdings.length > 0 && holdings[0].plaid_accounts?.plaid_connections) {
      lastSync = holdings[0].plaid_accounts.plaid_connections.last_synced_at
    }

    return NextResponse.json({
      holdings: holdings || [],
      consolidated_holdings: consolidatedHoldings,
      summary: {
        total_holdings: holdings?.length || 0,
        unique_securities: consolidatedHoldings.length,
        total_value: totalValue,
        total_cost_basis: totalCostBasis,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percent: totalGainLossPercent,
        last_synced_at: lastSync,
      },
    })

  } catch (error: any) {
    console.error('Error getting holdings:', error)
    return NextResponse.json(
      {
        error: 'Failed to get holdings',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

