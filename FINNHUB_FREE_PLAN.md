# Finnhub - Plan Gratuito: Qué Funciona y Qué No

## ✅ Endpoints Disponibles en Plan Gratuito

### 1. **Quote (Precios en Tiempo Real)**
```
GET /api/stocks/quote?symbol=AAPL
```
**Funciona perfectamente** ✅
- Precio actual
- Cambio del día
- Apertura, máximo, mínimo
- Cierre anterior

### 2. **Stock Candles (Históricos)**
```
GET /api/stocks/candles?symbol=AAPL&from=timestamp&to=timestamp
```
**Funciona perfectamente** ✅
- Precios históricos
- Datos OHLCV (Open, High, Low, Close, Volume)
- Hasta 1 año de historia

### 3. **Symbol Search (Búsqueda)**
```
GET /api/stocks/search?q=Apple
```
**Funciona perfectamente** ✅
- Búsqueda por símbolo o nombre
- Lista de resultados con descripciones

## ⚠️ Endpoints con Limitaciones

### 4. **Company Profile (Perfil de Empresa)**
```
GET /api/stocks/profile?symbol=AAPL
```
**Limitado en plan gratuito** ⚠️
- ❌ No disponible: Logo, información detallada
- ✅ Se devuelven datos básicos predeterminados
- **Solución**: El componente funciona con datos mínimos

### 5. **Company Basic Financials (Métricas)**
```
GET /api/stocks/metrics?symbol=AAPL
```
**No disponible en plan gratuito** ❌
- ❌ P/E Ratio
- ❌ Market Cap detallado
- ❌ Beta
- ❌ Dividend Yield
- **Solución**: La app no mostrará estas métricas pero seguirá funcionando

## 💰 Alternativas para Obtener Métricas

Si necesitas las métricas financieras completas, tienes varias opciones:

### Opción 1: Actualizar a Finnhub Premium
**Costo**: $59.99/mes
- ✅ Todas las métricas financieras
- ✅ Datos fundamentales completos
- ✅ Más llamadas por minuto

### Opción 2: Usar Alpha Vantage (Alternativa Gratuita)
**Costo**: Gratis (500 llamadas/día)
- ✅ Fundamentales básicos
- ✅ P/E, Market Cap, EPS
- ❌ Requiere implementación adicional

**Cómo implementar Alpha Vantage:**
```bash
# Obtener API key: https://www.alphavantage.co/support/#api-key

# Agregar a .env.local
ALPHA_VANTAGE_API_KEY=tu-key

# Ejemplo de llamada:
https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=tu-key
```

### Opción 3: Yahoo Finance (Sin API Oficial)
**Costo**: Gratis
- ✅ Muchos datos disponibles
- ❌ No hay API oficial (usar scraping o librerías no oficiales)
- ⚠️ Puede cambiar sin previo aviso

## 🎯 Lo Que Funciona Perfectamente Sin Pagar

Con el plan gratuito de Finnhub, tu aplicación puede:

1. ✅ **Buscar Acciones**: Funciona perfecto
2. ✅ **Ver Gráficos de Precios**: Funciona perfecto con históricos de 1 año
3. ✅ **Ver Precio Actual**: En tiempo real
4. ✅ **Crear Carteras**: Funciona perfecto
5. ✅ **Simular Backtest**: Funciona perfecto con datos históricos
6. ⚠️ **Ver Fundamentales**: Solo datos básicos

## 🔧 Configuración Recomendada Actual

**Para desarrollo y pruebas:**
```env
# Solo Finnhub (suficiente para la mayoría de funciones)
FINNHUB_API_KEY=tu-key-gratuita
```

**Para producción con métricas completas:**
```env
# Opción 1: Finnhub Premium
FINNHUB_API_KEY=tu-key-premium

# Opción 2: Finnhub + Alpha Vantage
FINNHUB_API_KEY=tu-key-gratuita
ALPHA_VANTAGE_API_KEY=tu-key-gratuita
```

## 📊 Comparación de Planes

| Característica | Plan Gratuito | Premium ($60/mes) |
|---|---|---|
| Precios en tiempo real | ✅ 60 req/min | ✅ Ilimitado |
| Datos históricos | ✅ 1 año | ✅ 30+ años |
| Búsqueda de símbolos | ✅ | ✅ |
| Profile básico | ⚠️ Limitado | ✅ Completo |
| Métricas financieras | ❌ | ✅ |
| Fundamentales | ❌ | ✅ |
| Noticias | ❌ | ✅ |
| Earnings | ❌ | ✅ |
| Recomendaciones | ❌ | ✅ |

## 🚀 Próximos Pasos

1. **Usa el plan gratuito para desarrollo**
   - Todas las funciones core funcionan
   - Solo las métricas financieras no están disponibles

2. **Considera agregar Alpha Vantage** si necesitas fundamentales
   - Gratis y fácil de implementar
   - Complementa bien a Finnhub

3. **Actualiza a Premium** solo si necesitas:
   - Métricas en producción para muchos usuarios
   - Más de 60 requests/minuto
   - Datos históricos > 1 año

## 💡 Tips para Maximizar el Plan Gratuito

1. **Cache los datos**: Guarda respuestas en localStorage/Redis para reducir llamadas
2. **Usa símbolos populares**: Se actualizan más frecuentemente
3. **Combina APIs**: Finnhub para precios + Alpha Vantage para fundamentales
4. **Implementa rate limiting**: Controla las llamadas de tus usuarios

## 🐛 Solución de Problemas

### Error: "You don't have access to this resource"
**Causa**: Endpoint no disponible en plan gratuito
**Solución**: Ya implementada - la app maneja estos errores graciosamente

### Error: Rate limit exceeded
**Causa**: Más de 60 llamadas por minuto
**Solución**: 
- Implementar cache
- Espaciar las llamadas
- Considerar upgrade

### Métricas no se muestran
**Causa**: Expected - no disponibles en plan gratuito
**Solución**: La app funciona sin ellas, o considera Alpha Vantage

---

**Resumen**: Tu app funciona al 90% con el plan gratuito. Solo las métricas financieras detalladas requieren un plan de pago o una API alternativa.
