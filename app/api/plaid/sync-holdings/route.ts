import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { plaidClient, validatePlaidConfig } from '@/lib/plaid/client'
import { decrypt } from '@/lib/plaid/encryption'

/**
 * POST /api/plaid/sync-holdings
 * Sincroniza holdings (posiciones) de una conexión de Plaid
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    validatePlaidConfig()
    
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connection_id } = await request.json()

    if (!connection_id) {
      return NextResponse.json(
        { error: 'connection_id is required' },
        { status: 400 }
      )
    }

    console.log(`[Sync] Starting sync for connection: ${connection_id}`)

    // 1. Obtener la conexión
    const { data: connection, error: connError } = await supabase
      .from('plaid_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Connection is not active', status: connection.status },
        { status: 400 }
      )
    }

    // 2. Desencriptar access_token
    let accessToken: string
    try {
      accessToken = decrypt(connection.access_token)
    } catch (error) {
      console.error('[Sync] Failed to decrypt access token:', error)
      
      // Marcar conexión como error
      await supabase
        .from('plaid_connections')
        .update({
          status: 'error',
          error_message: 'Failed to decrypt access token',
        })
        .eq('id', connection_id)

      return NextResponse.json(
        { error: 'Failed to decrypt access token' },
        { status: 500 }
      )
    }

    // 3. Obtener cuentas de la conexión
    const { data: accounts } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('connection_id', connection_id)
      .eq('is_active', true)

    if (!accounts || accounts.length === 0) {
      console.log('[Sync] No active accounts found')
      return NextResponse.json({
        success: true,
        holdings_synced: 0,
        message: 'No active accounts to sync',
      })
    }

    console.log(`[Sync] Found ${accounts.length} accounts to sync`)

    // 4. Obtener holdings de Plaid
    let holdingsResponse
    try {
      holdingsResponse = await plaidClient.investmentsHoldingsGet({
        access_token: accessToken,
      })
    } catch (error: any) {
      console.error('[Sync] Plaid API error:', error.response?.data || error.message)
      
      // Actualizar estado de conexión
      await supabase
        .from('plaid_connections')
        .update({
          status: 'error',
          error_message: error.response?.data?.error_message || 'Failed to fetch holdings',
        })
        .eq('id', connection_id)

      // Log del error
      await supabase.from('plaid_sync_logs').insert({
        connection_id,
        user_id: user.id,
        sync_type: 'manual',
        status: 'error',
        error_message: error.response?.data?.error_message || error.message,
        duration_ms: Date.now() - startTime,
      })

      return NextResponse.json(
        {
          error: 'Failed to fetch holdings from Plaid',
          details: error.response?.data?.error_message || error.message,
        },
        { status: 500 }
      )
    }

    const holdings = holdingsResponse.data.holdings
    const securities = holdingsResponse.data.securities

    console.log(`[Sync] Received ${holdings.length} holdings and ${securities.length} securities`)

    // 5. Crear un mapa de securities para acceso rápido
    const securitiesMap = new Map(
      securities.map(sec => [sec.security_id, sec])
    )

    // 6. Preparar holdings para insertar/actualizar
    const holdingsToUpsert = holdings.map(holding => {
      const security = securitiesMap.get(holding.security_id)
      const account = accounts.find(acc => acc.account_id === holding.account_id)

      return {
        account_id: account?.id,
        connection_id: connection_id,
        user_id: user.id,
        security_id: holding.security_id,
        symbol: security?.ticker_symbol || null,
        name: security?.name || 'Unknown Security',
        type: security?.type || 'equity',
        quantity: holding.quantity,
        price: holding.institution_price,
        value: holding.institution_value,
        cost_basis: holding.cost_basis || null,
        institution_price: holding.institution_price,
        institution_value: holding.institution_value,
        iso_currency_code: holding.iso_currency_code || 'USD',
        synced_at: new Date().toISOString(),
      }
    }).filter(h => h.account_id) // Solo holdings con cuenta válida

    console.log(`[Sync] Prepared ${holdingsToUpsert.length} holdings to upsert`)

    // 7. Eliminar holdings antiguos de esta conexión
    const { error: deleteError } = await supabase
      .from('real_holdings')
      .delete()
      .eq('connection_id', connection_id)

    if (deleteError) {
      console.error('[Sync] Error deleting old holdings:', deleteError)
    }

    // 8. Insertar nuevos holdings
    let holdingsSynced = 0
    if (holdingsToUpsert.length > 0) {
      const { error: insertError } = await supabase
        .from('real_holdings')
        .insert(holdingsToUpsert)

      if (insertError) {
        console.error('[Sync] Error inserting holdings:', insertError)
        throw insertError
      }

      holdingsSynced = holdingsToUpsert.length
    }

    // 9. Actualizar balances de cuentas
    for (const account of holdingsResponse.data.accounts) {
      const dbAccount = accounts.find(a => a.account_id === account.account_id)
      if (dbAccount) {
        await supabase
          .from('plaid_accounts')
          .update({
            balance_current: account.balances.current || 0,
            balance_available: account.balances.available || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbAccount.id)
      }
    }

    // 10. Actualizar conexión con timestamp de última sincronización
    await supabase
      .from('plaid_connections')
      .update({
        last_synced_at: new Date().toISOString(),
        status: 'active',
        error_message: null,
      })
      .eq('id', connection_id)

    // 11. Log de sincronización exitosa
    await supabase.from('plaid_sync_logs').insert({
      connection_id,
      user_id: user.id,
      sync_type: 'manual',
      status: 'success',
      holdings_synced: holdingsSynced,
      transactions_synced: 0,
      duration_ms: Date.now() - startTime,
    })

    console.log(`[Sync] Completed successfully in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      holdings_synced: holdingsSynced,
      accounts_synced: accounts.length,
      duration_ms: Date.now() - startTime,
      message: `Successfully synced ${holdingsSynced} holdings`,
    })

  } catch (error: any) {
    console.error('[Sync] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Failed to sync holdings',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

