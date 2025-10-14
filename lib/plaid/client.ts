import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

// Configuración del cliente de Plaid
const plaidEnv = process.env.PLAID_ENV as keyof typeof PlaidEnvironments
// FORZAR SANDBOX - no usar otros entornos
const basePath = PlaidEnvironments.sandbox

console.log('🔧 Plaid Configuration (FORCED SANDBOX):')
console.log('  PLAID_ENV from env:', process.env.PLAID_ENV)
console.log('  Base Path (FORCED):', basePath)
console.log('  Client ID:', process.env.PLAID_CLIENT_ID ? '✅ Set' : '❌ Missing')
console.log('  Secret:', process.env.PLAID_SECRET ? '✅ Set' : '❌ Missing')
console.log('  ⚠️  FORCING SANDBOX MODE - MetaMask should NOT appear!')

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)

// Configuración de productos y países
export const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS?.split(',') || ['investments']) as Products[]

// Para sandbox, usar US ya que los bancos de prueba son estadounidenses
// En producción, cambiar a ['ES', 'GB', 'FR', 'DE'] para Europa
export const PLAID_COUNTRY_CODES = ['US'] as CountryCode[]

// Validar que las variables de entorno estén configuradas
export function validatePlaidConfig() {
  const required = ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'PLAID_ENV']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required Plaid environment variables: ${missing.join(', ')}`)
  }
  
  return true
}

