# 🧪 Guía de Testing - Integración de Plaid

## ✅ Implementación Completada

### **Archivos Creados:**

#### **Backend (API Routes):**
1. ✅ `lib/plaid/client.ts` - Cliente de Plaid
2. ✅ `lib/plaid/encryption.ts` - Encriptación de tokens
3. ✅ `app/api/plaid/create-link-token/route.ts` - Crear link token
4. ✅ `app/api/plaid/exchange-token/route.ts` - Intercambiar tokens
5. ✅ `app/api/plaid/sync-holdings/route.ts` - Sincronizar holdings
6. ✅ `app/api/plaid/get-holdings/route.ts` - Obtener holdings
7. ✅ `app/api/plaid/connections/route.ts` - Listar conexiones
8. ✅ `app/api/plaid/disconnect/route.ts` - Desconectar cuenta

#### **Frontend (Componentes):**
9. ✅ `components/PlaidLinkButton.tsx` - Botón para conectar broker
10. ✅ `components/RealPortfolioViewer.tsx` - Vista de portfolio real
11. ✅ `components/ConnectionsManager.tsx` - Gestión de conexiones
12. ✅ `components/ui/tabs.tsx` - Componente de tabs
13. ✅ `app/real-portfolio/page.tsx` - Página principal
14. ✅ `app/real-portfolio/RealPortfolioContent.tsx` - Contenido de la página

#### **Navegación:**
15. ✅ `components/Navigation.tsx` - Actualizado con link a Real Portfolio

---

## 🧪 Cómo Probar la Integración

### **Paso 1: Verificar Variables de Entorno**

Asegúrate de que tu `.env.local` tenga:

```bash
PLAID_CLIENT_ID=tu_client_id
PLAID_SECRET=tu_sandbox_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=investments
PLAID_COUNTRY_CODES=ES,GB,FR,DE
ENCRYPTION_KEY=tu_clave_de_32_caracteres
```

### **Paso 2: Reiniciar el Servidor**

```bash
# Detener el servidor actual (Ctrl+C)
pnpm dev
```

### **Paso 3: Navegar a Real Portfolio**

1. Abre tu navegador en: `http://localhost:3000`
2. Inicia sesión
3. Ve a la navegación superior → Click en **"Real Portfolio"**

---

## 🔄 Flujo de Testing Completo

### **Test 1: Conectar Cuenta de Broker**

1. **En Portfolios → tab "Connections"**, haz click en **"Connect New Account"**
2. Se abrirá el modal de Plaid Link
3. **⚠️ IGNORA METAMASK** - No es válido para sandbox
4. **En el campo de búsqueda, escribe uno de estos BROKERS:**
   - `Robinhood` ✅ (Recomendado)
   - `Fidelity Investments` ✅
   - `TD Ameritrade` ✅
   - `E*TRADE` ✅
   - **NO busques bancos** (Chase, Wells Fargo, etc.) - No funcionan con `investments`
5. **Selecciona el broker** de la lista
6. **Credenciales de prueba en Sandbox:**
   - Username: `user_good`
   - Password: `pass_good`
   - MFA: `1234` (si se solicita)
7. **Selecciona las cuentas** que quieres conectar
8. Click en **"Continue"**
9. Deberías ver un mensaje de éxito

**Resultado esperado:**
- ✅ Conexión guardada en la base de datos
- ✅ Holdings sincronizados automáticamente en background
- ✅ Redirección a la vista de portfolio

### **Test 2: Ver Portfolio Real**

1. Después de conectar, deberías ver:
   - **4 Cards de resumen:**
     - Total Value
     - Gain/Loss (con color verde/rojo)
     - Holdings Count
     - Last Sync
   - **Tabla de holdings** con:
     - Symbol, Name, Quantity
     - Average Price, Value
     - Gain/Loss, Weight %

**Resultado esperado:**
- ✅ Datos reales de Plaid mostrados
- ✅ Cálculos correctos de gain/loss
- ✅ Porcentajes de peso correctos

### **Test 3: Sincronizar Manualmente**

1. En la card "Last Sync", click en **"Sync now"**
2. Debería aparecer un spinner
3. Espera 2-5 segundos
4. Los datos deberían actualizarse

**Resultado esperado:**
- ✅ Spinner mientras sincroniza
- ✅ Holdings actualizados
- ✅ "Last Sync" actualizado a "hace unos segundos"

### **Test 4: Gestionar Conexiones**

1. Click en la tab **"Connections"**
2. Deberías ver tu conexión con:
   - Nombre de la institución
   - Status (Active)
   - Número de cuentas
   - Total value
   - Botón de eliminar (icono de basura)

**Resultado esperado:**
- ✅ Lista de conexiones mostrada
- ✅ Estadísticas correctas
- ✅ Status "Active" con icono verde

### **Test 5: Desconectar Cuenta**

1. Click en el icono de **basura** (🗑️)
2. Confirma la eliminación
3. La conexión debería desaparecer
4. Los holdings también deberían eliminarse

**Resultado esperado:**
- ✅ Confirmación solicitada
- ✅ Conexión eliminada de la base de datos
- ✅ Holdings eliminados (cascade)
- ✅ UI actualizada

### **Test 6: Conectar Múltiples Cuentas**

1. Repite el Test 1 con otra institución
2. Deberías ver ambas conexiones en la tab "Connections"
3. En la tab "Portfolio", deberías ver holdings de ambas cuentas consolidados

**Resultado esperado:**
- ✅ Múltiples conexiones soportadas
- ✅ Holdings consolidados por símbolo
- ✅ Total value suma de todas las cuentas

---

## 🐛 Troubleshooting

### **Error: "Failed to create link token"**

**Posibles causas:**
- Variables de entorno incorrectas
- PLAID_CLIENT_ID o PLAID_SECRET inválidos
- PLAID_ENV no es "sandbox"

**Solución:**
1. Verifica `.env.local`
2. Reinicia el servidor
3. Revisa la consola del servidor para más detalles

### **Error: "Failed to exchange token"**

**Posibles causas:**
- ENCRYPTION_KEY no configurada
- ENCRYPTION_KEY muy corta (<32 caracteres)
- Error en la base de datos (RLS policies)

**Solución:**
1. Verifica que ENCRYPTION_KEY esté configurada
2. Verifica que ejecutaste el SQL en Supabase
3. Revisa los logs del servidor

### **Holdings no se sincronizan**

**Posibles causas:**
- La institución no soporta Investments API
- Error en el access_token
- Problema con RLS policies

**Solución:**
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor
3. Intenta desconectar y reconectar
4. Verifica que la tabla `real_holdings` tenga RLS policies correctas

### **"No Holdings Found"**

**Posibles causas:**
- Sincronización aún en progreso (es automática en background)
- La cuenta no tiene holdings
- Error en la sincronización

**Solución:**
1. Espera 5-10 segundos y recarga la página
2. Click en "Sync now" manualmente
3. Revisa la tab "Connections" para ver si hay errores

---

## 📊 Datos de Prueba en Sandbox

### **Instituciones Disponibles en Sandbox:**

**⚠️ IMPORTANTE:** Estamos usando el producto `investments`, por lo que necesitas buscar **BROKERS** (corretaje), NO bancos tradicionales.

#### 🇺🇸 **Estados Unidos (Recomendado para Sandbox):**
- **`Robinhood`** ✅ - Funciona perfectamente
- **`Fidelity Investments`** ✅ - Funciona bien
- **`TD Ameritrade`** ✅ - Funciona bien
- **`E*TRADE`** ✅ - Funciona bien
- **`Charles Schwab`** ✅ - Funciona bien

#### 🇪🇺 **Europa (Puede no funcionar en Sandbox):**
- **`Interactive Brokers`** - Puede funcionar
- **`Trading 212`** - Puede funcionar
- **`Degiro`** - Limitado
- **`Revolut`** - Limitado
- **`eToro`** - Limitado

**❌ NO FUNCIONAN en Sandbox:**
- Chase, Wells Fargo, Bank of America (son bancos, no brokers)
- MetaMask (es una wallet de crypto, no un broker)

### **Holdings de Ejemplo (Sandbox):**

El sandbox de Plaid devuelve holdings ficticios como:
- AAPL (Apple)
- GOOGL (Google)
- TSLA (Tesla)
- MSFT (Microsoft)
- AMZN (Amazon)

Con cantidades y precios realistas.

---

## 🔍 Verificar en Supabase

### **Tablas a Revisar:**

1. **`plaid_connections`**
   - Debería tener 1 fila por cada broker conectado
   - `access_token` debería estar encriptado (no legible)
   - `status` debería ser "active"

2. **`plaid_accounts`**
   - Debería tener 1+ filas por conexión
   - `balance_current` con valores

3. **`real_holdings`**
   - Debería tener 1 fila por cada holding
   - `symbol`, `quantity`, `value` poblados
   - `synced_at` reciente

4. **`plaid_sync_logs`**
   - Debería tener logs de cada sincronización
   - `status` = "success"
   - `holdings_synced` > 0

---

## 🚨 Troubleshooting

### **Problema: Doble Click Requerido**
- **Síntoma:** Necesitas hacer click dos veces en "Connect Broker Account"
- **Solución:** ✅ **SOLUCIONADO** - Ahora funciona con un solo click

### **Problema: MetaMask Detectado Automáticamente**
- **Síntoma:** Plaid detecta MetaMask y no permite seleccionar instituciones
- **Solución:** 
  1. Haz click en "X" para cerrar el modal
  2. Vuelve a hacer click en "Connect Broker Account"
  3. Si persiste, prueba en modo incógnito (sin extensiones)
  4. Usa la búsqueda manual para encontrar instituciones

### **Problema: No Aparecen Instituciones Sandbox**
- **Síntoma:** No encuentras Interactive Brokers, Trading 212, etc.
- **Solución:**
  1. Asegúrate de estar en **Sandbox** (`PLAID_ENV=sandbox`)
  2. Busca manualmente: "Interactive Brokers", "Trading 212", "Revolut"
  3. Si no aparecen, verifica que `PLAID_COUNTRY_CODES` incluya tu país

---

## ✅ Checklist de Validación

Antes de considerar la integración completa:

- [ ] Puedo conectar una cuenta de broker
- [ ] Veo mis holdings en la tabla
- [ ] Los cálculos de gain/loss son correctos
- [ ] Puedo sincronizar manualmente
- [ ] Puedo desconectar una cuenta
- [ ] Puedo conectar múltiples cuentas
- [ ] Los holdings se consolidan correctamente
- [ ] El "Last Sync" se actualiza
- [ ] No hay errores en la consola
- [ ] Los datos se guardan en Supabase correctamente

---

## 🚀 Próximos Pasos

Una vez que todo funcione en sandbox:

1. **Integrar AI Assistant** para analizar portfolio real
2. **Comparar** portfolio real vs estrategias simuladas
3. **Alertas** cuando holdings cambian significativamente
4. **Tax Loss Harvesting** suggestions
5. **Rebalancing** automático
6. **Reportes PDF** exportables
7. **Migrar a Production** (requiere aprobación de Plaid)

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs del servidor** (terminal donde corre `pnpm dev`)
2. **Revisa la consola del navegador** (F12 → Console)
3. **Revisa Supabase** (SQL Editor → Query las tablas)
4. **Revisa Plaid Dashboard** (https://dashboard.plaid.com/)
5. **Consulta la documentación** de Plaid

---

**¡La integración de Plaid está completa y lista para probar!** 🎉

