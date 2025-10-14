import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { plaidClient, validatePlaidConfig } from '@/lib/plaid/client'
import { decrypt } from '@/lib/plaid/encryption'

/**
 * POST /api/plaid/disconnect
 * Desconecta una conexión de Plaid y elimina sus datos
 */
export async function POST(request: NextRequest) {
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

    console.log(`Disconnecting connection: ${connection_id}`)

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

    // 2. Desencriptar access_token y revocar en Plaid
    try {
      const accessToken = decrypt(connection.access_token)
      
      // Revocar el access token en Plaid
      await plaidClient.itemRemove({
        access_token: accessToken,
      })
      
      console.log('Access token revoked in Plaid')
    } catch (error) {
      console.warn('Could not revoke access token in Plaid:', error)
      // Continuamos con la eliminación local aunque falle en Plaid
    }

    // 3. Eliminar la conexión (cascade eliminará accounts, holdings, etc.)
    const { error: deleteError } = await supabase
      .from('plaid_connections')
      .delete()
      .eq('id', connection_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting connection:', deleteError)
      throw deleteError
    }

    console.log('Connection deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully',
    })

  } catch (error: any) {
    console.error('Error disconnecting:', error)

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
        error: 'Failed to disconnect',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

