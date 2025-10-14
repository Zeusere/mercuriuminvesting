import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES, validatePlaidConfig } from '@/lib/plaid/client'
import { Products } from 'plaid'

/**
 * POST /api/plaid/create-link-token
 * Crea un link_token para inicializar Plaid Link en el frontend
 */
export async function POST(request: NextRequest) {
  try {
    // Validar configuración de Plaid
    validatePlaidConfig()
    
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener perfil del usuario para personalizar la experiencia
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single()

    const userName = profile?.display_name || user.email?.split('@')[0] || 'User'

    console.log('Creating link token for user:', user.id)
    console.log('🔧 Link Token Config:')
    console.log('  Products:', PLAID_PRODUCTS)
    console.log('  Country Codes:', PLAID_COUNTRY_CODES)
    console.log('  Environment:', process.env.PLAID_ENV)
    console.log('  ⚠️  SANDBOX MODE - MetaMask should NOT be detected!')
    console.log('  ⚠️  If MetaMask appears, something is wrong with the environment!')

    // Crear link token con configuración específica para sandbox
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: 'Mercurium Investments',
      products: PLAID_PRODUCTS as Products[],
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en', // Inglés para evitar problemas con MetaMask
      webhook: process.env.PLAID_WEBHOOK_URL,
      // Configuración específica para investments
      ...(PLAID_PRODUCTS.includes('investments' as Products) && {
        investments: {
          // Permitir selección de cuentas
        }
      }),
      // Configuración para forzar modo sandbox
      ...(process.env.PLAID_ENV === 'sandbox' && {
        // Configuración específica de sandbox
        institution_id: undefined, // No especificar institución para permitir búsqueda
      })
    })

    console.log('Link token created successfully')

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    })

  } catch (error: any) {
    console.error('Error creating link token:', error)
    
    // Errores específicos de Plaid
    if (error.response?.data) {
      const plaidError = error.response.data
      return NextResponse.json(
        { 
          error: 'Plaid API error',
          details: plaidError.error_message || plaidError.display_message,
          code: plaidError.error_code
        },
        { status: error.response.status || 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create link token',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

