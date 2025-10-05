# Trading AI Dashboard - Guía de Configuración

## 🎯 Descripción

Dashboard de trading con inteligencia artificial que permite crear órdenes de compra/venta mediante texto o voz. El sistema utiliza OpenAI para interpretar instrucciones en lenguaje natural y convertirlas en órdenes estructuradas que se envían al broker.

## 🚀 Características Principales

- **Entrada por texto o voz**: Crea órdenes usando lenguaje natural
- **IA para interpretar órdenes**: OpenAI GPT-4o-mini procesa tus instrucciones
- **Soporte para múltiples tipos de órdenes**:
  - Órdenes de mercado (MARKET)
  - Órdenes límite (LIMIT)
  - Stop Loss
  - Take Profit
- **Broker simulado**: Prueba el sistema sin riesgo
- **Historial de órdenes**: Visualiza todas tus órdenes activas y ejecutadas
- **Dashboard con estadísticas**: Monitorea tu actividad de trading

## 📋 Requisitos Previos

1. Node.js 18+ y npm
2. Cuenta de Supabase
3. API Key de OpenAI (opcional pero recomendado)

## 🛠️ Configuración Paso a Paso

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Ve a la sección "SQL Editor" en tu proyecto de Supabase
3. Ejecuta el script SQL ubicado en `supabase/migrations/001_trading_orders.sql`
4. Esto creará las tablas `trading_orders` y `broker_configs` con las políticas de seguridad RLS

### 3. Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Completa las variables:
   ```env
   # Obtén estos valores de tu proyecto de Supabase (Settings > API)
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

   # Obtén tu API key de OpenAI en https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-...
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 4. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Cómo Usar

### Crear una Orden por Texto

1. Inicia sesión en el dashboard
2. En el campo de entrada, escribe tu orden en lenguaje natural. Ejemplos:
   - "Comprar Palantir pero si pierdo 1000 euros cerrar la operación"
   - "Comprar 100 acciones de Apple a 175 dólares"
   - "Vender 50 Tesla con take profit del 15%"
   - "Comprar Microsoft por 5000 euros con stop loss del 10%"

3. Haz clic en "Crear Orden"
4. El sistema procesará tu orden y mostrará la interpretación
5. La orden se creará en estado PENDING

### Crear una Orden por Voz

1. Haz clic en el icono del micrófono 🎤
2. Permite el acceso al micrófono cuando el navegador lo solicite
3. Dicta tu orden en voz alta
4. El sistema la transcribirá y procesará automáticamente

### Ejecutar una Orden

1. Ve a la lista de órdenes
2. Encuentra tu orden en estado PENDING
3. Haz clic en "Ejecutar Orden"
4. El sistema simulará la ejecución en el broker y actualizará el estado

## 🎨 Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   └── orders/
│   │       ├── route.ts           # CRUD de órdenes
│   │       ├── parse/route.ts     # Parser con IA
│   │       └── execute/route.ts   # Ejecución en broker
│   └── dashboard/
│       └── page.tsx               # Página principal
├── components/
│   ├── DashboardContent.tsx       # Dashboard principal
│   ├── OrderInput.tsx             # Formulario de entrada
│   └── OrdersList.tsx             # Lista de órdenes
├── types/
│   └── trading.ts                 # Tipos TypeScript
└── supabase/
    └── migrations/
        └── 001_trading_orders.sql # Schema de BD
```

## 🔧 Personalización

### Agregar Nuevos Símbolos

Edita `app/api/orders/execute/route.ts` y agrega más símbolos al objeto `prices`:

```typescript
const prices: Record<string, number> = {
  'PLTR': 25.50,
  'AAPL': 175.30,
  'TU_SIMBOLO': 100.00,
}
```

### Conectar con Broker Real

Para conectar con un broker real (como Interactive Brokers, Alpaca, etc.):

1. Modifica `app/api/orders/execute/route.ts`
2. Reemplaza la clase `BrokerSimulator` con la integración real
3. Implementa los métodos de autenticación y ejecución según la API del broker

Ejemplo básico:

```typescript
class RealBroker {
  async executeOrder(order: any) {
    // Conectar con API del broker
    const response = await fetch('https://api.broker.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BROKER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: order.symbol,
        side: order.side.toLowerCase(),
        type: order.type.toLowerCase(),
        quantity: order.quantity,
      }),
    })
    
    return await response.json()
  }
}
```

### Mejorar el Parser de IA

El prompt del sistema se puede modificar en `app/api/orders/parse/route.ts`. Puedes:

- Agregar más ejemplos
- Soportar más idiomas
- Añadir validaciones específicas
- Incluir análisis de riesgo

## 🔐 Seguridad

- ✅ Row Level Security (RLS) activado en Supabase
- ✅ Las órdenes solo son visibles por el usuario que las creó
- ✅ Validación de sesión en todos los endpoints
- ⚠️ **IMPORTANTE**: En producción, nunca expongas API keys del broker en el frontend

## 🧪 Modo Simulado vs Producción

**Modo Simulado (Actual)**:
- No se conecta a ningún broker real
- Simula precios de mercado
- Ideal para pruebas y desarrollo

**Para Producción**:
1. Implementa autenticación con broker real
2. Agrega confirmaciones de órdenes
3. Implementa gestión de riesgos
4. Agrega notificaciones de ejecución
5. Considera límites de trading por usuario

## 📊 Próximas Funcionalidades

- [ ] Gestión de portafolio
- [ ] Gráficos de precios en tiempo real
- [ ] Análisis técnico automatizado
- [ ] Alertas de precio
- [ ] Backtesting de estrategias
- [ ] Integración con múltiples brokers
- [ ] Trading algorítmico

## 🐛 Troubleshooting

### "OpenAI API key not configured"

Si ves este error, tienes dos opciones:
1. Configura `OPENAI_API_KEY` en `.env.local` (recomendado)
2. El sistema usará un parser básico sin IA (funcionalidad limitada)

### "Reconocimiento de voz no disponible"

El reconocimiento de voz solo funciona en navegadores compatibles (Chrome, Edge, Safari).
Usa HTTPS en producción para que funcione correctamente.

### Errores de Supabase

Verifica que:
1. Las tablas están creadas correctamente
2. Las políticas RLS están activadas
3. Las variables de entorno son correctas

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

