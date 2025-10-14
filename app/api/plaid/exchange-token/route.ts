import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { plaidClient, validatePlaidConfig } from '@/lib/plaid/client'
import { encrypt } from '@/lib/plaid/encryption'

/**
 * POST /api/plaid/exchange-token
 * Intercambia el public_token por un access_token y guarda la conexión
 */
export async function POST(request: NextRequest) {
  try {
    validatePlaidConfig()
    
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { public_token, metadata } = await request.json()

    if (!public_token) {
      return NextResponse.json(
        { error: 'public_token is required' },
        { status: 400 }
      )
    }

    console.log('Exchanging public token for user:', user.id)
    console.log('Institution:', metadata?.institution?.name)

    // 1. Intercambiar public_token por access_token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    console.log('Token exchanged successfully. Item ID:', itemId)

    // 2. Obtener información de la institución
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    })

    const institutionId = itemResponse.data.item.institution_id || null

    // 3. Obtener información detallada de la institución si está disponible
    let institutionName = metadata?.institution?.name || 'Unknown Institution'
    
    if (institutionId) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['ES', 'GB', 'FR', 'DE', 'US'] as any,
        })
        institutionName = institutionResponse.data.institution.name
      } catch (error) {
        console.warn('Could not fetch institution details:', error)
      }
    }

    // 4. Encriptar el access_token antes de guardarlo
    const encryptedAccessToken = encrypt(accessToken)

    // 5. Guardar la conexión en la base de datos
    const { data: connection, error: dbError } = await supabase
      .from('plaid_connections')
      .insert({
        user_id: user.id,
        item_id: itemId,
        access_token: encryptedAccessToken,
        institution_id: institutionId,
        institution_name: institutionName,
        account_type: metadata?.account?.subtype || 'brokerage',
        status: 'active',
        last_synced_at: null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save connection to database')
    }

    console.log('Connection saved to database:', connection.id)

    // 6. Obtener cuentas asociadas al item
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accounts = accountsResponse.data.accounts

    // 7. Guardar las cuentas en la base de datos
    const accountsToInsert = accounts.map(account => ({
      connection_id: connection.id,
      user_id: user.id,
      account_id: account.account_id,
      account_name: account.name,
      account_mask: account.mask || null,
      account_type: account.type,
      account_subtype: account.subtype || null,
      balance_current: account.balances.current || 0,
      balance_available: account.balances.available || null,
      currency: account.balances.iso_currency_code || 'USD',
      is_active: true,
    }))

    const { error: accountsError } = await supabase
      .from('plaid_accounts')
      .insert(accountsToInsert)

    if (accountsError) {
      console.error('Error saving accounts:', accountsError)
    } else {
      console.log(`Saved ${accounts.length} accounts`)
    }

    // 8. Iniciar sincronización inicial de holdings (en background)
    // Llamamos a la API de sync sin esperar la respuesta
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/plaid/sync-holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connection.id }),
    }).catch(err => console.error('Background sync error:', err))

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      institution_name: institutionName,
      accounts_count: accounts.length,
      message: 'Connection established successfully. Syncing holdings in background...',
    })

  } catch (error: any) {
    console.error('Error exchanging token:', error)

    if (error.response?.data) {
      const plaidError = error.response.data
      return NextResponse.json(
        {
          error: 'Plaid API error',
          details: plaidError.error_message || plaidError.display_message,
          code: plaidError.error_code,
        },
        { status: error.response.status || 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to exchange token',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

