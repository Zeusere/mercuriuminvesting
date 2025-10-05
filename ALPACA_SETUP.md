# Configuración de Alpaca Markets

Este proyecto usa **Alpaca Markets** para obtener datos históricos **REALES** de acciones de forma **GRATUITA**.

## ¿Por qué Alpaca?

- ✅ **Datos históricos REALES** (no simulados)
- ✅ **100% GRATIS** (no requiere tarjeta de crédito)
- ✅ **Paper Trading** (ambiente de prueba sin dinero real)
- ✅ **200 llamadas/minuto** en plan gratuito
- ✅ **Todas las acciones de US**
- ✅ **Datos OHLCV** (Open, High, Low, Close, Volume)
- ✅ **Feed IEX gratuito** (datos reales con 15 min de delay)

## Configuración Paso a Paso

### 1. Crear Cuenta en Alpaca

1. Ve a [https://alpaca.markets/](https://alpaca.markets/)
2. Haz clic en **"Sign Up"** en la esquina superior derecha
3. Completa el formulario de registro:
   - Nombre
   - Email
   - Contraseña
4. Confirma tu email

### 2. Acceder a Paper Trading

1. Una vez dentro, verás dos opciones:
   - **Live Trading** (requiere verificación y depósito)
   - **Paper Trading** (GRATIS, sin verificación)
2. Selecciona **Paper Trading** (es el que necesitamos)
3. No necesitas depositar dinero ni verificar identidad

### 3. Obtener API Keys

1. En el dashboard de Paper Trading, busca el menú lateral
2. Ve a **"API Keys"** o **"Your API Keys"**
3. Verás dos opciones:
   - Si ya tienes un API key, lo verás listado
   - Si no, haz clic en **"Generate New Key"** o **"Regenerate Key"**
4. **IMPORTANTE**: Copia ambas keys inmediatamente:
   ```
   Key ID: PKxxxxxxxxxxxxx
   Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. **⚠️ La Secret Key solo se muestra una vez**. Guárdala en un lugar seguro.

### 4. Configurar en tu Proyecto

1. Abre tu archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes líneas:
   ```env
   ALPACA_API_KEY=tu_key_id_aqui
   ALPACA_API_SECRET=tu_secret_key_aqui
   ```
3. Reemplaza `tu_key_id_aqui` y `tu_secret_key_aqui` con tus keys reales
4. Guarda el archivo

### 5. Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Limpiar cache de Next.js
rm -rf .next

# Reiniciar
npm run dev
```

## Verificar que Funciona

1. Ve a tu aplicación: [http://localhost:3000/stocks](http://localhost:3000/stocks)
2. Busca una acción (ej: "AAPL", "MSFT", "TSLA")
3. Deberías ver un gráfico con datos históricos **REALES**
4. El gráfico debería coincidir con el precio actual mostrado arriba

## Límites del Plan Gratuito

| Característica | Plan Gratuito (Paper Trading) |
|----------------|-------------------------------|
| Llamadas/minuto | 200 |
| Datos históricos | ✅ Sí (hasta 5 años) |
| Resolución | 1min, 5min, 15min, 1hora, 1día |
| Acciones | Todas las de US |
| Feed de datos | IEX (delay de 15 min para datos recientes) |
| Costo | $0 (Gratis) |
| Requiere depósito | ❌ No |
| Requiere verificación | ❌ No |

## Troubleshooting

### Error: "Alpaca API keys not configured"

**Solución**:
1. Verifica que tu archivo `.env.local` tenga ambas variables
2. Las variables deben empezar sin espacios: `ALPACA_API_KEY=PK...`
3. Reinicia el servidor después de agregar las variables

### Error: "forbidden"

**Solución**:
1. Verifica que estés usando las keys de **Paper Trading**, no de Live Trading
2. Regenera tus API keys en el dashboard de Alpaca
3. Asegúrate de haber copiado ambas keys correctamente

### Error: "subscription does not permit querying recent SIP data"

**Solución**:
Este error ya está solucionado en el código. El plan gratuito solo soporta el feed IEX, no SIP. La aplicación está configurada para usar automáticamente el feed IEX.

### Error: "No data available for this symbol"

**Solución**:
1. Verifica que el símbolo sea correcto (ej: "AAPL" no "APPLE")
2. Algunas acciones pueden no tener datos para periodos muy antiguos
3. Intenta con un periodo más corto (1M en lugar de 5Y)
4. El feed IEX puede no tener datos para todas las acciones pequeñas

## Ventajas sobre Finnhub

| Característica | Alpaca (Gratuito) | Finnhub (Gratuito) |
|----------------|-------------------|-------------------|
| Datos históricos | ✅ Reales (IEX feed) | ❌ No disponibles |
| Llamadas/minuto | 200 | 60 |
| Requiere tarjeta | ❌ No | ❌ No |
| Datos recientes | 15 min delay | Tiempo real |
| Años de historial | 5+ | 0 |
| Mejor para | Gráficos históricos | Cotizaciones actuales |

## Recursos Adicionales

- [Documentación oficial de Alpaca](https://alpaca.markets/docs/)
- [API Reference](https://alpaca.markets/docs/api-references/)
- [Forum de soporte](https://forum.alpaca.markets/)
- [Límites de rate](https://alpaca.markets/docs/api-references/market-data-api/)

## Próximos Pasos

Una vez que tengas Alpaca configurado, los gráficos de acciones mostrarán:
- ✅ Precios históricos reales
- ✅ Datos que coinciden con el precio actual
- ✅ Gráficos precisos para análisis técnico
- ✅ Simulaciones de portfolio realistas

¡Y todo gratis! 🎉
