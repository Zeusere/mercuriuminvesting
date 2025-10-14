# 🏦 Plaid Integration Setup Guide

## 📋 Variables de Entorno Necesarias

Necesitas agregar estas variables a tu archivo `.env.local`:

```bash
# ============================================
# PLAID (Real Portfolio Integration)
# ============================================
# Get your keys from: https://dashboard.plaid.com/

# Plaid Client ID
PLAID_CLIENT_ID=your_plaid_client_id

# Plaid Secret (use sandbox secret for development)
PLAID_SECRET=your_plaid_secret_sandbox

# Plaid Environment: 'sandbox', 'development', or 'production'
PLAID_ENV=sandbox

# Plaid Products (comma-separated)
PLAID_PRODUCTS=investments

# Plaid Country Codes (comma-separated)
# For Europe: GB (UK), FR (France), ES (Spain), DE (Germany), IT (Italy), NL (Netherlands), IE (Ireland)
# You can add multiple: ES,GB,FR,DE
PLAID_COUNTRY_CODES=ES,GB,FR,DE

# ============================================
# ENCRYPTION (for storing Plaid access tokens)
# ============================================
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

---

## 🚀 Paso 1: Crear Cuenta en Plaid

1. **Ve a**: https://dashboard.plaid.com/signup
2. **Regístrate** con tu email
3. **Completa** el onboarding básico
4. **Selecciona** el plan "Sandbox" (gratis)

---

## 🔑 Paso 2: Obtener API Keys

1. **Ve a**: https://dashboard.plaid.com/team/keys
2. **Copia**:
   - `client_id` → `PLAID_CLIENT_ID`
   - `sandbox secret` → `PLAID_SECRET`
3. **Configura** el environment como `sandbox`

---

## 🔐 Paso 3: Generar Encryption Key

Para proteger los access tokens de Plaid en tu base de datos:

### En Windows (PowerShell):
```powershell
# Generar una clave aleatoria de 32 bytes en base64
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### En Mac/Linux:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como `ENCRYPTION_KEY`.

---

## 📊 Paso 4: Ejecutar SQL en Supabase

1. **Ve a**: Tu proyecto de Supabase → SQL Editor
2. **Copia** todo el contenido de `supabase-plaid-setup.sql`
3. **Ejecuta** el script
4. **Verifica** que las tablas se crearon:
   - `plaid_connections`
   - `plaid_accounts`
   - `real_holdings`
   - `plaid_transactions`
   - `real_portfolio_analyses`
   - `plaid_sync_logs`

---

## 🧪 Paso 5: Probar en Sandbox

En el entorno **sandbox** de Plaid:

### Credenciales de Prueba:
- **Username**: `user_good`
- **Password**: `pass_good`
- **MFA Code**: `1234` (si se solicita)

### Instituciones de Prueba Disponibles:

#### 🇺🇸 Estados Unidos:
- **Robinhood** (ins_56)
- **Fidelity** (ins_3)
- **TD Ameritrade** (ins_13)
- **E*TRADE** (ins_14)
- **Charles Schwab** (ins_5)

#### 🇪🇺 Europa:
- **Revolut** (ins_129571) - UK/EU
- **Trading 212** (ins_127989) - UK/EU
- **eToro** (ins_127990) - Multi-country
- **Interactive Brokers** (ins_127991) - Global
- **Degiro** (ins_127992) - EU (Netherlands-based)
- **Banco Santander** (ins_127993) - España
- **BBVA** (ins_127994) - España
- **ING** (ins_127995) - España/EU

### Datos de Prueba:
El sandbox devuelve datos ficticios pero realistas:
- Holdings de ejemplo (AAPL, GOOGL, TSLA, etc.)
- Balances simulados
- Transacciones históricas

---

## 🔄 Paso 6: Configurar Webhooks (Opcional - Para Producción)

Los webhooks permiten que Plaid te notifique cuando:
- Hay nuevas transacciones
- Se requiere re-autenticación
- Hay errores en la conexión

### Setup:
1. **Crea** una ruta API: `/api/plaid/webhook`
2. **Configura** en Plaid Dashboard: https://dashboard.plaid.com/team/webhooks
3. **Agrega** tu URL: `https://tudominio.com/api/plaid/webhook`
4. **Verifica** con el test de Plaid

---

## 🇪🇺 **Consideraciones Importantes para Europa**

### ⚠️ **Limitaciones de Plaid en Europa:**

1. **Cobertura Limitada**:
   - Plaid tiene **menos instituciones** soportadas en Europa vs USA
   - No todos los brokers españoles están disponibles
   - Algunos bancos solo permiten lectura de cuentas bancarias, no brokerage

2. **Open Banking (PSD2)**:
   - En Europa, Plaid usa **Open Banking APIs** (PSD2)
   - Requiere consentimiento explícito del usuario cada 90 días
   - Algunos bancos requieren re-autenticación frecuente

3. **Brokers Populares en España**:
   - ✅ **Interactive Brokers** - Muy usado, bien soportado
   - ✅ **Degiro** - Popular en EU, soporte variable
   - ✅ **Trading 212** - Creciente, buen soporte
   - ✅ **eToro** - Social trading, soporte limitado
   - ⚠️ **MyInvestor** - Puede no estar soportado
   - ⚠️ **Renta 4** - Puede no estar soportado
   - ⚠️ **Selfbank** - Puede no estar soportado

4. **Bancos Tradicionales**:
   - Santander, BBVA, CaixaBank: Solo cuentas bancarias
   - Para **brokerage** necesitas usar sus plataformas específicas

### 🔄 **Alternativas para España:**

Si Plaid no cubre suficientes brokers españoles, considera:

1. **Nordigen (GoCardless)** - Gratis, Open Banking EU
   - Mejor cobertura en Europa
   - Gratis para siempre
   - Más bancos españoles
   - Pero: No tan maduro como Plaid

2. **TrueLayer** - Open Banking UK/EU
   - Buena cobertura europea
   - Pricing competitivo

3. **CSV Upload Manual**:
   - Usuario sube CSV de su broker
   - Funciona con CUALQUIER broker
   - Más trabajo pero 100% compatible

### 💡 **Recomendación:**

Para España, te sugiero:

1. **Fase 1**: Implementa Plaid para brokers internacionales (Interactive Brokers, Trading 212)
2. **Fase 2**: Agrega CSV upload para brokers españoles no soportados
3. **Fase 3**: Evalúa Nordigen si necesitas más cobertura española

### 📊 **Brokers Más Usados en España (2024):**

1. **Interactive Brokers** - ✅ Plaid soportado
2. **Degiro** - ✅ Plaid soportado (limitado)
3. **Trading 212** - ✅ Plaid soportado
4. **eToro** - ⚠️ Soporte limitado
5. **MyInvestor** - ❌ No soportado por Plaid
6. **Renta 4** - ❌ No soportado por Plaid
7. **Selfbank** - ❌ No soportado por Plaid

---

## 💰 Costos de Plaid

### Sandbox (Desarrollo):
- ✅ **Gratis**
- ✅ Datos de prueba ilimitados
- ✅ Todas las features disponibles

### Development (Testing con datos reales):
- ✅ **Gratis** para los primeros 100 usuarios
- ⚠️ Requiere aprobación de Plaid
- ⚠️ Solo instituciones selectas

### Production:
- 💵 **~$0.30-$0.60** por usuario/mes
- 💵 Investments API: $0.30/usuario/mes
- 💵 Primeros 100 usuarios gratis (startup program)
- ⚠️ Requiere aprobación completa de Plaid
- ⚠️ Compliance review

---

## 🔒 Seguridad

### ✅ Buenas Prácticas:

1. **Nunca** expongas tu `PLAID_SECRET` en el frontend
2. **Siempre** encripta los `access_token` en la base de datos
3. **Usa** HTTPS en producción
4. **Implementa** rate limiting en tus API routes
5. **Valida** que el usuario sea el dueño de la conexión (RLS)
6. **Rota** las keys periódicamente
7. **Monitorea** logs de acceso sospechoso

### 🚨 Red Flags:
- ❌ Access tokens en logs
- ❌ Secrets en código versionado
- ❌ Sin encriptación de tokens
- ❌ Sin validación de ownership

---

## 🧪 Testing

### Casos de Prueba en Sandbox:

1. **Conexión Exitosa**:
   - User: `user_good` / Pass: `pass_good`
   - Debe conectar y sincronizar holdings

2. **Conexión con Error**:
   - User: `user_bad` / Pass: `pass_bad`
   - Debe fallar y mostrar error apropiado

3. **Re-autenticación Requerida**:
   - User: `user_reauth` / Pass: `pass_reauth`
   - Simula cuando el usuario debe re-autenticar

4. **Múltiples Cuentas**:
   - Conectar 2+ instituciones diferentes
   - Verificar que se muestran todas

---

## 📚 Recursos Útiles

- **Plaid Docs**: https://plaid.com/docs/
- **Quickstart**: https://plaid.com/docs/quickstart/
- **API Reference**: https://plaid.com/docs/api/
- **Sandbox Guide**: https://plaid.com/docs/sandbox/
- **React Plaid Link**: https://github.com/plaid/react-plaid-link
- **Support**: https://dashboard.plaid.com/support

---

## 🐛 Troubleshooting

### Error: "invalid client_id"
- ✅ Verifica que `PLAID_CLIENT_ID` esté correcto
- ✅ No tiene espacios extra
- ✅ Está en el archivo `.env.local`

### Error: "invalid secret"
- ✅ Usa el **sandbox secret**, no el development/production
- ✅ Verifica que `PLAID_ENV=sandbox`

### Error: "product not enabled"
- ✅ Verifica que `PLAID_PRODUCTS=investments`
- ✅ En Plaid Dashboard, habilita "Investments" product

### Holdings no se sincronizan:
- ✅ Verifica que la institución soporte Investments API
- ✅ Revisa los logs en `/api/plaid/sync-holdings`
- ✅ Verifica RLS policies en Supabase

### Access token inválido:
- ✅ Puede haber expirado (requiere re-auth)
- ✅ Verifica que esté correctamente encriptado/desencriptado
- ✅ Revisa que el `item_id` sea correcto

---

## ✅ Checklist de Setup

- [ ] Cuenta de Plaid creada
- [ ] API keys obtenidas (client_id + secret)
- [ ] Variables de entorno configuradas
- [ ] Encryption key generada
- [ ] SQL ejecutado en Supabase
- [ ] Tablas creadas correctamente
- [ ] RLS policies habilitadas
- [ ] Dependencias instaladas (`plaid`, `react-plaid-link`)
- [ ] Probado en sandbox con `user_good`
- [ ] Holdings sincronizados correctamente

---

## 🎯 Próximos Pasos

Una vez completado este setup:

1. ✅ Crear API routes de Plaid
2. ✅ Crear componente PlaidLink
3. ✅ Crear vista de portfolio real
4. ✅ Integrar AI Assistant para portfolios reales
5. ✅ Implementar sincronización automática
6. ✅ Testing exhaustivo
7. ✅ Preparar para producción

---

**¿Listo para continuar? Avísame cuando tengas las API keys de Plaid y hayas ejecutado el SQL en Supabase.** 🚀

