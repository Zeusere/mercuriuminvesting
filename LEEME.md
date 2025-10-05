# 🚀 WhiteApp - Esqueleto de Aplicación Web Moderna

**Una plantilla completa y lista para producción con autenticación, integración de IA e interfaz hermosa.**

## 🎯 Inicio Rápido - 3 Pasos

### 1️⃣ Instalar Dependencias (1 minuto)

```bash
npm install
```

### 2️⃣ Configurar Variables de Entorno (2 minutos)

1. Copia el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

2. Ve a [supabase.com](https://supabase.com) y crea una cuenta
3. Crea un nuevo proyecto
4. Ve a Settings → API y copia:
   - Project URL
   - anon public key
5. Pega estos valores en tu archivo `.env.local`

### 3️⃣ Ejecutar la Aplicación (30 segundos)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 📚 Documentación Principal

| Archivo | Propósito |
|---------|-----------|
| **[START_HERE.md](./START_HERE.md)** | Guía de inicio (inglés) |
| **[SETUP.md](./SETUP.md)** | Instrucciones detalladas de configuración |
| **[README.md](./README.md)** | Documentación completa del proyecto |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Guía de despliegue a producción |
| **[AI_INTEGRATION.md](./AI_INTEGRATION.md)** | Cómo integrar IA |

---

## ✨ ¿Qué Incluye Este Proyecto?

### 🎨 Landing Page Completa
- ✅ Sección Hero con llamados a la acción
- ✅ Showcase de características
- ✅ Tabla de precios con 3 niveles
- ✅ Testimonios de clientes
- ✅ Header y Footer profesionales
- ✅ Modo claro y oscuro
- ✅ Completamente responsive

### 🔐 Sistema de Autenticación
- ✅ Registro con email/contraseña
- ✅ Login con email/contraseña
- ✅ Login con Google OAuth
- ✅ Rutas protegidas automáticamente
- ✅ Gestión de sesiones con Supabase

### 📊 Dashboard Privado
- ✅ Área privada para usuarios registrados
- ✅ Tarjetas de estadísticas
- ✅ Showcase de herramientas IA
- ✅ Menú de acciones rápidas
- ✅ Gestión de perfil de usuario

### 🤖 Listo para IA
- ✅ Variables de entorno para OpenAI (ChatGPT, DALL-E)
- ✅ Variables para Google AI (Gemini)
- ✅ Variables para Anthropic (Claude)
- ✅ Ejemplos de integración incluidos

### 💻 Stack Tecnológico Moderno
- ✅ Next.js 14 con App Router
- ✅ TypeScript para seguridad de tipos
- ✅ Tailwind CSS para estilos
- ✅ Supabase para backend
- ✅ Lucide Icons
- ✅ Configuración de ESLint

---

## 🛠️ Configuración de Supabase (Paso a Paso)

### Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate con GitHub o Google
4. Crea un nuevo proyecto:
   - **Nombre**: whiteapp (o el que prefieras)
   - **Password**: Crea una contraseña segura (¡guárdala!)
   - **Región**: Selecciona la más cercana a tus usuarios
   - **Plan**: Free (gratis)
5. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Obtener las Claves API

1. En el dashboard de Supabase, ve a **Settings** (⚙️)
2. Haz clic en **API**
3. Copia estos tres valores:

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon public key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   **service_role key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Paso 3: Configurar el Archivo .env.local

Edita el archivo `.env.local` y pega tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Paso 4: Configurar URLs de Redirección

1. En Supabase, ve a **Authentication** → **Settings**
2. En **Site URL**, pon: `http://localhost:3000`
3. En **Redirect URLs**, añade: `http://localhost:3000/auth/callback`
4. Guarda los cambios

### ✅ ¡Listo! Ya puedes usar la autenticación

---

## 🔑 Configurar Google OAuth (Opcional)

### Paso 1: Crear Proyecto en Google Cloud

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Nombre: "WhiteApp" (o el que prefieras)

### Paso 2: Configurar Pantalla de Consentimiento

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External**
3. Rellena:
   - App name: WhiteApp
   - User support email: tu email
   - Developer contact: tu email
4. Guarda y continúa

### Paso 3: Crear Credenciales OAuth

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Tipo: **Web application**
4. Nombre: WhiteApp Web Client
5. **Authorized redirect URIs**: 
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   (Reemplaza xxxxx con tu ID de proyecto de Supabase)
6. Crea y copia el **Client ID** y **Client Secret**

### Paso 4: Configurar en Supabase

1. En Supabase, ve a **Authentication** → **Providers**
2. Encuentra **Google** y habilítalo
3. Pega tu **Client ID** y **Client Secret**
4. Guarda

### Paso 5: Añadir a .env.local

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

---

## 🎨 Personalización Básica

### Cambiar Colores de Marca

Edita `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    500: '#0ea5e9',  // Color principal
    600: '#0284c7',  // Color hover
    // ... más tonos
  }
}
```

### Cambiar Nombre de la App

Edita `.env.local`:

```env
NEXT_PUBLIC_APP_NAME=MiApp
NEXT_PUBLIC_APP_DESCRIPTION=Mi aplicación increíble
```

### Modificar Landing Page

Edita estos archivos en la carpeta `components/`:
- `Hero.tsx` - Sección principal
- `Features.tsx` - Lista de características
- `Pricing.tsx` - Tabla de precios
- `Testimonials.tsx` - Testimonios

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm start                # Iniciar servidor de producción
npm run lint             # Verificar calidad del código

# Base de Datos
supabase login           # Iniciar sesión en Supabase
supabase db pull         # Descargar esquema de base de datos

# Despliegue
vercel --prod            # Desplegar a Vercel
netlify deploy --prod    # Desplegar a Netlify
```

---

## 🚀 Desplegar a Producción

### Opción 1: Vercel (Recomendado)

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Añade las variables de entorno
5. ¡Despliega!

**Guía detallada**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Opción 2: Netlify

1. Sube tu código a GitHub
2. Ve a [netlify.com](https://netlify.com)
3. Importa tu repositorio
4. Configura build: `npm run build`
5. Añade variables de entorno
6. ¡Despliega!

### ⚠️ Importante para Producción

No olvides actualizar en tu `.env`:
```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Y en Supabase:
- Actualizar **Site URL** a tu dominio de producción
- Añadir tu dominio a **Redirect URLs**

---

## 🤖 Integrar IA (Opcional)

### OpenAI (ChatGPT, DALL-E)

1. Regístrate en [platform.openai.com](https://platform.openai.com)
2. Crea una API key
3. Añade a `.env.local`:
```env
OPENAI_API_KEY=sk-...
```

### Google AI (Gemini)

1. Ve a [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Crea una API key
3. Añade a `.env.local`:
```env
GOOGLE_AI_API_KEY=...
```

### Anthropic (Claude)

1. Regístrate en [console.anthropic.com](https://console.anthropic.com)
2. Crea una API key
3. Añade a `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

**Ejemplos de código**: [AI_INTEGRATION.md](./AI_INTEGRATION.md)

---

## 💰 Comercializar Este Producto

Este esqueleto puede ser vendido de varias formas:

1. **Como SaaS** - Ofrécelo como servicio con suscripción
2. **Como Plantilla** - Vende el código en marketplaces
3. **Servicio de Desarrollo** - Úsalo para proyectos de clientes
4. **Producto Educativo** - Crea cursos enseñando a usarlo

**Guía completa**: [COMMERCIALIZATION.md](./COMMERCIALIZATION.md)

---

## 📁 Estructura del Proyecto

```
whiteapp/
├── app/                    # Páginas de Next.js
│   ├── page.tsx           # Landing page
│   ├── login/             # Página de login
│   ├── signup/            # Página de registro
│   └── dashboard/         # Dashboard privado
├── components/            # Componentes reutilizables
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   └── ...
├── lib/                   # Configuración y utilidades
│   └── supabase/         # Setup de Supabase
├── public/               # Archivos estáticos
└── *.md                  # Documentación
```

---

## 🆘 Problemas Comunes

### ❌ "Failed to fetch"

**Solución**: 
- Verifica que las claves de Supabase en `.env.local` sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### ❌ No puedo hacer login

**Solución**:
- Confirma tu email (revisa spam)
- Verifica que el usuario existe en Supabase Dashboard → Authentication → Users

### ❌ Google OAuth no funciona

**Solución**:
- Verifica que la URL de redirección sea exacta
- Asegúrate de que Google provider esté habilitado en Supabase
- Verifica Client ID y Secret

### ❌ El modo oscuro no funciona

**Solución**:
- Limpia la caché del navegador
- Revisa localStorage en DevTools
- Recarga la página

---

## 📞 Soporte

- 📖 **Documentación**: Lee todos los archivos `.md` incluidos
- 💬 **Discord de Supabase**: [discord.supabase.com](https://discord.supabase.com)
- 💬 **Discord de Next.js**: [nextjs.org/discord](https://nextjs.org/discord)
- 🐛 **Issues**: Abre un issue en GitHub

---

## ✅ Lista de Verificación

### Configuración Inicial
- [ ] Instalar dependencias (`npm install`)
- [ ] Crear cuenta en Supabase
- [ ] Copiar y configurar `.env.local`
- [ ] Ejecutar `npm run dev`
- [ ] Probar que funciona

### Personalización
- [ ] Cambiar nombre de la app
- [ ] Modificar colores de marca
- [ ] Personalizar landing page
- [ ] Añadir tu logo

### Desarrollo
- [ ] Crear tablas en Supabase (si es necesario)
- [ ] Añadir características únicas
- [ ] Integrar IA (si es necesario)
- [ ] Probar en móvil

### Producción
- [ ] Configurar dominio
- [ ] Actualizar variables de entorno
- [ ] Desplegar a Vercel/Netlify
- [ ] Probar en producción
- [ ] ¡Lanzar! 🚀

---

## 🎉 ¡Estás Listo!

Todo lo que necesitas está aquí. Ahora ve y construye algo increíble.

**Próximos pasos:**

1. Lee [START_HERE.md](./START_HERE.md) para más detalles
2. Configura Supabase siguiendo los pasos arriba
3. Ejecuta `npm install` y `npm run dev`
4. Empieza a personalizar

---

**¡Feliz desarrollo! 🚀**

*Última actualización: 2 de octubre de 2025*

