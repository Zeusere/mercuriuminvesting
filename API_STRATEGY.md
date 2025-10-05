# Estrategia de APIs - Trading Dashboard

Este proyecto usa **dos APIs complementarias** para obtener lo mejor de cada una de forma **100% GRATUITA**.

## 📊 Resumen Rápido

| Funcionalidad | API Usada | Por Qué |
|---------------|-----------|---------|
| 🔍 Búsqueda de símbolos | **Finnhub** | Base de datos completa |
| 💰 Cotización actual | **Finnhub** | Datos en tiempo real |
| 🏢 Perfil de empresa | **Finnhub** | Información básica disponible |
| 📈 Métricas financieras | **Finnhub** | Datos fundamentales básicos |
| 📊 **Gráficos históricos** | **Alpaca** | Datos históricos REALES |
| 💼 **Backtest de portfolios** | **Alpaca** | Datos históricos REALES |

## 🎯 División de Responsabilidades

### Finnhub (Datos Actuales y Búsqueda)

**Endpoints:**
- `/api/stocks/search` - Buscar símbolos de acciones
- `/api/stocks/quote` - Obtener precio actual y cambios del día
- `/api/stocks/profile` - Información básica de la empresa
- `/api/stocks/metrics` - Métricas financieras básicas

**Ventajas:**
- ✅ Datos en **tiempo real** (sin delay)
- ✅ Búsqueda rápida de símbolos
- ✅ 60 llamadas por minuto
- ✅ No requiere tarjeta de crédito

**Limitaciones:**
- ❌ No incluye datos históricos en plan gratuito

### Alpaca Markets (Datos Históricos)

**Endpoints:**
- `/api/stocks/candles` - Datos históricos OHLCV (gráficos)
- `/api/portfolios/backtest` - Simulación de rendimiento de portfolios

**Ventajas:**
- ✅ Datos históricos **REALES** (no simulados)
- ✅ Hasta **5 años** de historial
- ✅ 200 llamadas por minuto
- ✅ Feed IEX gratuito
- ✅ No requiere tarjeta de crédito

**Limitaciones:**
- ⚠️ Feed IEX tiene 15 min de delay para datos recientes
- ⚠️ Solo acciones de US

## 🔧 Configuración Necesaria

Necesitas configurar ambas APIs en tu `.env.local`:

```env
# Finnhub - Para cotizaciones y búsqueda
FINNHUB_API_KEY=tu-finnhub-key

# Alpaca - Para datos históricos
ALPACA_API_KEY=tu-alpaca-key-id
ALPACA_API_SECRET=tu-alpaca-secret-key
```

## 📝 Cómo Obtener las Keys

### Finnhub (2 minutos)
1. Ve a [https://finnhub.io/register](https://finnhub.io/register)
2. Regístrate (no requiere tarjeta)
3. Copia tu API key del dashboard

### Alpaca (5 minutos)
1. Ve a [https://alpaca.markets/](https://alpaca.markets/)
2. Crea cuenta y selecciona "Paper Trading"
3. Ve a "API Keys" en el dashboard
4. Genera un nuevo key pair
5. Copia ambas keys (Key ID y Secret Key)

Ver `ALPACA_SETUP.md` para instrucciones detalladas.

## 🚀 Flujo de Datos en la Aplicación

### Cuando buscas una acción:

1. **Usuario escribe en el buscador** → `/api/stocks/search` (Finnhub)
2. **Selecciona una acción** → Fetch paralelo:
   - `/api/stocks/quote` (Finnhub) → Precio actual
   - `/api/stocks/profile` (Finnhub) → Info de empresa
   - `/api/stocks/metrics` (Finnhub) → Métricas básicas
   - `/api/stocks/candles` (Alpaca) → **Gráfico histórico REAL**

### Cuando creas un portfolio:

1. **Añadir acciones** → `/api/stocks/search` (Finnhub)
2. **Ver precios actuales** → `/api/stocks/quote` (Finnhub)
3. **Simular rendimiento** → `/api/portfolios/backtest` (Alpaca)
   - Obtiene datos históricos de cada acción
   - Calcula rendimiento ponderado
   - Genera gráfico de rendimiento **REAL**

## ✅ Por Qué Esta Estrategia es Óptima

1. **Datos Actuales Precisos**: Finnhub da precios en tiempo real sin delay
2. **Historial Real**: Alpaca proporciona datos históricos reales, no simulados
3. **100% Gratuito**: Ambas APIs tienen planes gratuitos generosos
4. **Complementarias**: Cada API hace lo que mejor sabe hacer
5. **Sin Tarjeta**: Ninguna requiere información de pago

## 🔍 Solución de Problemas

### Error: "Finnhub API key not configured"
- Verifica que `FINNHUB_API_KEY` esté en `.env.local`
- Reinicia el servidor después de agregar la key

### Error: "Alpaca API keys not configured"
- Verifica que `ALPACA_API_KEY` y `ALPACA_API_SECRET` estén en `.env.local`
- Ambas keys son necesarias
- Reinicia el servidor después de agregarlas

### Error: "subscription does not permit querying recent SIP data"
- Ya está solucionado en el código
- Usamos `feed: 'iex'` automáticamente
- Si persiste, limpia el cache: `rm -rf .next`

### Los gráficos no coinciden con el precio actual
- Si usas Alpaca correctamente, los datos deberían coincidir
- El feed IEX puede tener 15 min de delay en datos recientes
- Los datos históricos son 100% reales

## 📊 Comparación de Planes Gratuitos

| Característica | Finnhub Free | Alpaca Free |
|----------------|--------------|-------------|
| Precio actual | ✅ Tiempo real | ⚠️ 15 min delay |
| Búsqueda símbolos | ✅ Sí | ❌ No |
| Datos históricos | ❌ No | ✅ Hasta 5 años |
| Llamadas/min | 60 | 200 |
| Mejor para | Cotizaciones | Gráficos/Backtest |

## 🎉 Resultado Final

Con esta configuración tienes:
- ✅ Búsqueda rápida de acciones
- ✅ Precios en tiempo real
- ✅ Gráficos históricos con datos REALES
- ✅ Backtesting preciso de portfolios
- ✅ Todo 100% gratis

¡La combinación perfecta para un dashboard de trading profesional! 🚀
