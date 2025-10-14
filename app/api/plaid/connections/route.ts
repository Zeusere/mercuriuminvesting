import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/plaid/connections
 * Obtiene todas las conexiones de Plaid del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener conexiones con sus cuentas y holdings
    const { data: connections, error } = await supabase
      .from('plaid_connections')
      .select(`
        *,
        plaid_accounts (
          *,
          real_holdings (
            id,
            symbol,
            value
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connections:', error)
      throw error
    }

    // Calcular estadísticas para cada conexión
    const connectionsWithStats = connections?.map(conn => {
      const accounts = conn.plaid_accounts || []
      const totalAccounts = accounts.length
      const totalBalance = accounts.reduce((sum: number, acc: any) => 
        sum + (acc.balance_current || 0), 0
      )
      
      const allHoldings = accounts.flatMap((acc: any) => acc.real_holdings || [])
      const totalHoldings = allHoldings.length
      const totalHoldingsValue = allHoldings.reduce((sum: number, h: any) => 
        sum + (h.value || 0), 0
      )

      return {
        id: conn.id,
        institution_name: conn.institution_name,
        institution_id: conn.institution_id,
        account_type: conn.account_type,
        status: conn.status,
        last_synced_at: conn.last_synced_at,
        error_message: conn.error_message,
        created_at: conn.created_at,
        stats: {
          total_accounts: totalAccounts,
          total_balance: totalBalance,
          total_holdings: totalHoldings,
          total_holdings_value: totalHoldingsValue,
        },
      }
    })

    // Estadísticas globales
    const totalConnections = connections?.length || 0
    const activeConnections = connections?.filter(c => c.status === 'active').length || 0
    const totalValue = connectionsWithStats?.reduce((sum, c) => 
      sum + c.stats.total_holdings_value, 0
    ) || 0

    return NextResponse.json({
      connections: connectionsWithStats || [],
      summary: {
        total_connections: totalConnections,
        active_connections: activeConnections,
        total_portfolio_value: totalValue,
      },
    })

  } catch (error: any) {
    console.error('Error getting connections:', error)
    return NextResponse.json(
      {
        error: 'Failed to get connections',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

