# Variables de Entorno Necesarias

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
# Obtén estos valores de tu proyecto en https://app.supabase.com
# Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key

# OpenAI Configuration (requerido para procesamiento de lenguaje natural)
# Obtén tu API key en https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Finnhub Configuration (requerido para cotizaciones en tiempo real)
# Obtén tu API key gratis en https://finnhub.io/register
FINNHUB_API_KEY=tu-finnhub-api-key

# Alpaca Markets Configuration (requerido para datos históricos)
# Obtén tus API keys gratis en https://alpaca.markets
ALPACA_API_KEY=tu-alpaca-api-key
ALPACA_API_SECRET=tu-alpaca-api-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Cómo Obtener las Credenciales

### Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a Settings > API
4. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenAI

1. Ve a [https://platform.openai.com](https://platform.openai.com)
2. Inicia sesión o crea una cuenta
3. Ve a API Keys
4. Crea una nueva API key
5. Cópiala → `OPENAI_API_KEY`

**Nota**: Si no configuras OPENAI_API_KEY, el sistema usará un parser básico con funcionalidad limitada.

### Finnhub (Para cotizaciones en tiempo real)

1. Ve a [https://finnhub.io/register](https://finnhub.io/register)
2. Crea una cuenta gratuita (no requiere tarjeta de crédito)
3. Una vez registrado, verás tu API key en el dashboard
4. Cópiala → `FINNHUB_API_KEY`

**Nota**: El plan gratuito incluye:
- 60 llamadas por minuto
- Precios en tiempo real
- Búsqueda de símbolos
- Información básica de empresas

### Alpaca Markets (Para datos históricos)

1. Ve a [https://alpaca.markets/](https://alpaca.markets/)
2. Haz clic en "Sign Up" y crea una cuenta gratuita
3. Ve a "Paper Trading" (no requiere depósito ni verificación)
4. En el dashboard, ve a "API Keys"
5. Genera un nuevo API key (si no tienes uno)
6. Copia ambas keys:
   - Key ID → `ALPACA_API_KEY`
   - Secret Key → `ALPACA_API_SECRET`

**Nota**: El plan gratuito (Paper Trading) incluye:
- Datos históricos de mercado REALES
- Hasta 200 llamadas por minuto
- Datos de barras (OHLCV) diarios, por hora, minutos
- Información de todas las acciones de US
- Trading virtual para pruebas
- **No requiere depósito de dinero**

