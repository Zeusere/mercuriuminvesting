# 🇪🇺 Configuración de Plaid para Europa y España

## Variables de Entorno para tu `.env.local`

```bash
# ============================================
# PLAID - CONFIGURACIÓN PARA EUROPA/ESPAÑA
# ============================================

# Client ID de Plaid (obtener de dashboard.plaid.com)
PLAID_CLIENT_ID=tu_client_id_aqui

# Secret de Plaid (usar sandbox para desarrollo)
PLAID_SECRET=tu_sandbox_secret_aqui

# Environment: sandbox (desarrollo) | development (testing) | production
PLAID_ENV=sandbox

# Productos de Plaid (investments para portfolios de brokerage)
PLAID_PRODUCTS=investments

# Códigos de país para Europa
# ES = España, GB = Reino Unido, FR = Francia, DE = Alemania
# IT = Italia, NL = Países Bajos, IE = Irlanda
PLAID_COUNTRY_CODES=ES,GB,FR,DE

# ============================================
# ENCRYPTION KEY
# ============================================
# Generar con PowerShell:
# $bytes = New-Object byte[] 32
# [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
# [Convert]::ToBase64String($bytes)

ENCRYPTION_KEY=tu_clave_de_encriptacion_aqui
```

---

## 🎯 Configuración Recomendada por Mercado

### 🇪🇸 **Solo España:**
```bash
PLAID_COUNTRY_CODES=ES
```
**Brokers soportados:**
- Interactive Brokers
- Trading 212
- Degiro (limitado)

### 🇪🇺 **Europa Completa:**
```bash
PLAID_COUNTRY_CODES=ES,GB,FR,DE,IT,NL
```
**Máxima cobertura europea**

### 🌍 **Global (Europa + USA):**
```bash
PLAID_COUNTRY_CODES=ES,GB,FR,DE,US
```
**Para usuarios internacionales**

---

## 📋 Checklist de Setup

### 1. Obtener Credenciales de Plaid

- [ ] Ir a: https://dashboard.plaid.com/signup
- [ ] Crear cuenta (gratis)
- [ ] Verificar email
- [ ] Ir a "Team & Keys": https://dashboard.plaid.com/team/keys
- [ ] Copiar `client_id`
- [ ] Copiar `sandbox secret`

### 2. Generar Encryption Key

**En PowerShell (Windows):**
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Copia el resultado (será algo como: `xK7j9mP2nQ4vR8sT1wU5yA6bC3dE0fG7hI9jK2lM4nO=`)

### 3. Configurar `.env.local`

Crea o edita tu archivo `.env.local` en la raíz del proyecto:

```bash
# Pegar las variables de arriba con tus valores reales
PLAID_CLIENT_ID=5f8a9b2c3d4e5f6g7h8i9j0k
PLAID_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
PLAID_ENV=sandbox
PLAID_PRODUCTS=investments
PLAID_COUNTRY_CODES=ES,GB,FR,DE
ENCRYPTION_KEY=xK7j9mP2nQ4vR8sT1wU5yA6bC3dE0fG7hI9jK2lM4nO=
```

### 4. Ejecutar SQL en Supabase

- [ ] Ir a tu proyecto Supabase
- [ ] Abrir "SQL Editor"
- [ ] Copiar contenido de `supabase-plaid-setup.sql`
- [ ] Ejecutar el script
- [ ] Verificar que se crearon las tablas:
  - `plaid_connections`
  - `plaid_accounts`
  - `real_holdings`
  - `plaid_transactions`
  - `real_portfolio_analyses`
  - `plaid_sync_logs`

### 5. Reiniciar Servidor de Desarrollo

```bash
# Detener el servidor actual (Ctrl+C)
# Reiniciar para cargar nuevas variables de entorno
pnpm dev
```

---

## 🧪 Probar la Configuración

### En Sandbox (Datos de Prueba):

1. **Credenciales de prueba:**
   - Username: `user_good`
   - Password: `pass_good`

2. **Brokers de prueba disponibles:**
   - Interactive Brokers
   - Trading 212
   - Degiro
   - Revolut

3. **Lo que verás:**
   - Holdings ficticios (AAPL, GOOGL, etc.)
   - Balances simulados
   - Transacciones de ejemplo

---

## ⚠️ Notas Importantes para Europa

### 1. **Open Banking (PSD2)**
- En Europa, Plaid usa Open Banking APIs
- Requiere **consentimiento cada 90 días**
- Algunos bancos piden re-autenticación más frecuente

### 2. **Cobertura Limitada**
- Plaid tiene **menos brokers** en Europa que en USA
- Brokers españoles tradicionales (MyInvestor, Renta 4) no están soportados
- Considera implementar **CSV upload** como alternativa

### 3. **Regulación GDPR**
- Asegúrate de cumplir con GDPR
- Política de privacidad clara
- Consentimiento explícito del usuario
- Derecho al olvido (poder eliminar datos)

### 4. **Multi-idioma**
- Plaid Link soporta español automáticamente
- Se detecta del navegador del usuario
- Puedes forzar idioma si es necesario

---

## 🔄 Migración a Producción

Cuando estés listo para producción:

### 1. Cambiar a Production Environment

```bash
PLAID_ENV=production
PLAID_SECRET=tu_production_secret  # ¡Diferente al sandbox!
```

### 2. Solicitar Aprobación de Plaid

- Ir a: https://dashboard.plaid.com/overview/production
- Completar formulario de producción
- Explicar tu caso de uso
- Esperar aprobación (1-3 días)

### 3. Costos en Producción

- **Investments API**: ~€0.27/usuario/mes
- **Primeros 100 usuarios**: Gratis
- **Startup Program**: Hasta €10,000 en créditos

### 4. Configurar Webhooks

```bash
PLAID_WEBHOOK_URL=https://tudominio.com/api/plaid/webhook
```

---

## 🆘 Soporte

### Si tienes problemas:

1. **Documentación de Plaid**: https://plaid.com/docs/
2. **Soporte de Plaid**: https://dashboard.plaid.com/support
3. **Status de Plaid**: https://status.plaid.com/
4. **Community**: https://community.plaid.com/

### Errores comunes:

- **"Invalid client_id"**: Verifica que copiaste bien el client_id
- **"Invalid secret"**: Asegúrate de usar el sandbox secret
- **"Product not enabled"**: Habilita "Investments" en Plaid Dashboard
- **"Country not supported"**: Verifica que el país esté en tu lista

---

## ✅ Listo para Continuar

Una vez que tengas:
- ✅ Variables de entorno configuradas
- ✅ SQL ejecutado en Supabase
- ✅ Servidor reiniciado

**Estarás listo para que creemos los API routes y componentes de Plaid!** 🚀

