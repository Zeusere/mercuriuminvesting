# 📊 Sistema de Acciones y Carteras - Guía Completa

## 🎯 Nuevas Funcionalidades

El sistema ahora incluye dos módulos poderosos para análisis de acciones y gestión de carteras:

### 1. Búsqueda y Análisis de Acciones
- Busca cualquier acción del mercado por símbolo o nombre
- Visualiza gráficos interactivos de precios históricos
- Consulta métricas fundamentales (P/E ratio, Market Cap, Beta, etc.)
- Información detallada de empresas

### 2. Creación y Simulación de Carteras
- Construye carteras diversificadas
- Asigna ponderaciones personalizadas
- Simula rendimiento histórico (backtest)
- Métricas avanzadas: retorno, volatilidad, Sharpe ratio, drawdown
- Guarda y gestiona múltiples carteras

## 🚀 Configuración

### 1. Obtener API Key de Finnhub

Finnhub es la fuente de datos de mercado. El plan gratuito es más que suficiente:

1. **Registrarse**: Ve a [https://finnhub.io/register](https://finnhub.io/register)
2. **Verificar email**: Confirma tu correo electrónico
3. **Obtener API Key**: En el dashboard verás tu API key
4. **Configurar**: Agregar a `.env.local`:
   ```env
   FINNHUB_API_KEY=tu_api_key_aqui
   ```

**Límites del Plan Gratuito:**
- ✅ 60 requests/minuto (suficiente para uso normal)
- ✅ Datos en tiempo real
- ✅ Históricos hasta 1 año
- ✅ Fundamentales completos

### 2. Ejecutar Migraciones de Base de Datos

Ejecuta el nuevo script SQL para crear la tabla de carteras:

1. Ve a tu proyecto de Supabase
2. Abre SQL Editor
3. Ejecuta `supabase/migrations/002_portfolios.sql`

Esto crea la tabla `portfolios` con políticas de seguridad RLS.

## 📱 Cómo Usar

### Buscar y Analizar Acciones

1. **Acceder al Módulo**:
   - Desde el dashboard, haz clic en "Buscar Acciones"
   - O navega a `/stocks`

2. **Buscar una Acción**:
   - Escribe el símbolo (ej: AAPL) o nombre (ej: Apple)
   - Selecciona de los resultados
   - También puedes usar las acciones populares sugeridas

3. **Ver Información**:
   - **Precio Actual**: Precio en tiempo real con cambio del día
   - **Gráfico Histórico**: Selecciona periodo (1M, 3M, 6M, 1Y, 5Y)
   - **Fundamentales**: 
     - Market Cap
     - P/E Ratio
     - Beta (volatilidad relativa)
     - Máximos/mínimos de 52 semanas
     - Dividend Yield
   - **Información Empresa**:
     - Industria
     - País
     - Sitio web
     - Fecha de IPO

### Crear Carteras

1. **Acceder al Constructor**:
   - Desde el dashboard, haz clic en "Crear Carteras"
   - O navega a `/portfolios`
   - Haz clic en "Nueva Cartera"

2. **Configurar Cartera**:
   ```
   Nombre: Mi Cartera Tech
   Inversión: $10,000
   ```

3. **Agregar Acciones**:
   - Busca acciones usando el buscador
   - Haz clic para agregarlas a la cartera
   - Puedes agregar tantas como quieras

4. **Asignar Ponderaciones**:
   - Manualmente: Ingresa el % para cada acción
   - Automático: Haz clic en "Distribuir Equitativamente"
   - **Importante**: Los pesos deben sumar 100%

   Ejemplo:
   ```
   AAPL: 30%
   MSFT: 25%
   GOOGL: 20%
   TSLA: 15%
   NVDA: 10%
   ---
   Total: 100% ✅
   ```

5. **Simular Rendimiento**:
   - Haz clic en "Simular Rendimiento"
   - El sistema calcula backtest del último año
   - Verás:
     - Valor inicial vs final
     - Retorno total y anualizado
     - Volatilidad
     - Sharpe Ratio (retorno ajustado por riesgo)
     - Max Drawdown (pérdida máxima)
     - Gráfico de evolución

6. **Guardar Cartera**:
   - Haz clic en "Guardar Cartera"
   - Queda guardada en tu cuenta
   - Puedes crear múltiples carteras

## 📊 Entendiendo las Métricas

### Métricas de Acciones

**P/E Ratio (Price-to-Earnings)**
- Precio de la acción / Ganancias por acción
- < 15: Posiblemente infravalorada
- 15-25: Valoración normal
- \> 25: Posiblemente sobrevalorada o de alto crecimiento

**Beta**
- Mide volatilidad relativa al mercado
- = 1: Igual volatilidad que el mercado
- < 1: Menos volátil (más estable)
- \> 1: Más volátil (más riesgo/potencial)

**Market Cap**
- Valor total de la empresa
- Small cap: < $2B
- Mid cap: $2B - $10B
- Large cap: > $10B

### Métricas de Cartera

**Retorno Total**
- Ganancia o pérdida total en el periodo
- Ejemplo: +15% significa $10,000 → $11,500

**Retorno Anualizado**
- Retorno promedio por año
- Útil para comparar periodos diferentes

**Volatilidad**
- Qué tan variable es el retorno
- Alta volatilidad = más riesgo
- Baja volatilidad = más estable

**Sharpe Ratio**
- Retorno ajustado por riesgo
- > 1: Bueno
- > 2: Muy bueno
- > 3: Excelente

**Max Drawdown**
- Pérdida máxima desde un pico
- -20% significa que en el peor momento perdiste 20%
- Importante para evaluar riesgo de pérdida

## 🎨 Ejemplos de Carteras

### Cartera Conservadora
```
Objetivo: Bajo riesgo, ingresos estables
Inversión: $10,000

JNJ (Johnson & Johnson): 25%
PG (Procter & Gamble): 25%
KO (Coca-Cola): 20%
WMT (Walmart): 20%
VZ (Verizon): 10%

Características esperadas:
- Volatilidad: Baja (10-15%)
- Retorno anualizado: 5-10%
- Sharpe Ratio: > 1
```

### Cartera Equilibrada
```
Objetivo: Balance riesgo/retorno
Inversión: $10,000

AAPL (Apple): 20%
MSFT (Microsoft): 20%
JNJ (Johnson & Johnson): 15%
JPM (JPMorgan): 15%
XOM (Exxon): 15%
DIS (Disney): 15%

Características esperadas:
- Volatilidad: Media (15-20%)
- Retorno anualizado: 10-15%
- Sharpe Ratio: > 1.5
```

### Cartera Agresiva (Alto Crecimiento)
```
Objetivo: Máximo crecimiento, alto riesgo
Inversión: $10,000

NVDA (Nvidia): 25%
TSLA (Tesla): 20%
META (Meta): 20%
COIN (Coinbase): 15%
PLTR (Palantir): 20%

Características esperadas:
- Volatilidad: Alta (25-35%)
- Retorno anualizado: 15-30% (o pérdidas)
- Max Drawdown: Puede superar -40%
```

## 🔄 Flujo de Trabajo Recomendado

1. **Investigación Inicial**:
   ```
   Buscar Acciones → Analizar Fundamentales → Revisar Gráficos
   ```

2. **Selección**:
   ```
   Identificar 5-10 acciones interesantes
   Diversificar por sector e industria
   ```

3. **Construcción**:
   ```
   Crear Cartera → Asignar Pesos → Simular Rendimiento
   ```

4. **Análisis**:
   ```
   Revisar métricas del backtest
   Ajustar pesos si es necesario
   Comparar con otras carteras
   ```

5. **Decisión**:
   ```
   Guardar cartera
   (Futuro: Ejecutar en broker real)
   ```

## 🔧 API Endpoints Disponibles

### Acciones
```
GET /api/stocks/search?q=AAPL
GET /api/stocks/quote?symbol=AAPL
GET /api/stocks/candles?symbol=AAPL&from=timestamp&to=timestamp
GET /api/stocks/profile?symbol=AAPL
GET /api/stocks/metrics?symbol=AAPL
```

### Carteras
```
GET  /api/portfolios                    # Listar carteras
POST /api/portfolios                    # Crear cartera
PATCH /api/portfolios                   # Actualizar cartera
DELETE /api/portfolios?id=uuid          # Eliminar cartera
POST /api/portfolios/backtest           # Simular rendimiento
```

## 🚨 Limitaciones y Consideraciones

### Datos de Mercado
- Los datos son de Finnhub (plan gratuito)
- Históricos limitados a 1 año en backtests
- 60 requests/minuto (suficiente para uso normal)
- Datos en tiempo real con delay mínimo

### Simulación de Backtest
- Basado en datos históricos
- **El rendimiento pasado NO garantiza resultados futuros**
- No incluye: comisiones, impuestos, slippage
- Asume rebalanceo perfecto
- Usa precios de cierre diarios

### Consideraciones de Inversión
- ⚠️ Las simulaciones son para fines educativos
- ⚠️ No constituyen asesoramiento financiero
- ⚠️ Siempre haz tu propia investigación (DYOR)
- ⚠️ Invierte solo lo que puedas permitirte perder
- ⚠️ Considera consultar a un asesor financiero

## 🔮 Próximas Funcionalidades

- [ ] **Ejecución Real**: Conectar carteras con broker real
- [ ] **Rebalanceo Automático**: Mantener pesos objetivo
- [ ] **Alertas de Precio**: Notificaciones personalizadas
- [ ] **Análisis Técnico**: Indicadores (RSI, MACD, etc.)
- [ ] **Comparación de Carteras**: Side-by-side
- [ ] **Optimización Automática**: Maximizar Sharpe Ratio
- [ ] **Exportar Reportes**: PDF con análisis completo
- [ ] **Paper Trading**: Simular trading en tiempo real
- [ ] **Noticias de Empresas**: Feed de noticias relevantes
- [ ] **Screener de Acciones**: Filtros avanzados

## 💡 Tips y Trucos

### Optimización de Carteras

1. **Diversificación por Sector**:
   ```
   ✅ BUENO: Tech (30%), Healthcare (30%), Finance (20%), Energy (20%)
   ❌ MALO: Tech (100%) - Todo en un sector
   ```

2. **Tamaño de Posición**:
   ```
   ✅ BUENO: Ninguna posición > 30%
   ❌ MALO: Una acción = 70% de la cartera
   ```

3. **Correlación**:
   ```
   ✅ BUENO: Acciones con baja correlación entre sí
   ❌ MALO: Todas las acciones del mismo sector (alta correlación)
   ```

### Uso Eficiente de API

- Usa las acciones populares para explorar rápido
- El gráfico se actualiza solo cuando cambias el periodo
- Los backtests se cachean en el cliente
- Evita hacer múltiples backtests seguidos (rate limit)

## 📚 Recursos Adicionales

- [Finnhub Documentation](https://finnhub.io/docs/api)
- [Investopedia - Portfolio](https://www.investopedia.com/terms/p/portfolio.asp)
- [Sharpe Ratio Explained](https://www.investopedia.com/terms/s/sharperatio.asp)
- [Modern Portfolio Theory](https://www.investopedia.com/terms/m/modernportfoliotheory.asp)

---

**¿Preguntas o problemas?** Abre un issue en el repositorio o consulta la documentación principal.
