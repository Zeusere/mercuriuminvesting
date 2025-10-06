# 🚀 Setup Red Social - Instrucciones

## Paso 1: Ejecutar Migraciones en Supabase

Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

### 1. Crear tabla `user_profiles`

```sql
-- Copiar y pegar el contenido de: supabase/migrations/004_user_profiles.sql
```

### 2. Crear tabla `posts` y relacionadas

```sql
-- Copiar y pegar el contenido de: supabase/migrations/005_posts.sql
```

### 3. Actualizar tabla `portfolios`

```sql
-- Copiar y pegar el contenido de: supabase/migrations/006_portfolios_public.sql
```

## Paso 2: Verificar que las tablas se crearon

En el SQL Editor de Supabase, ejecuta:

```sql
-- Verificar user_profiles
SELECT * FROM user_profiles LIMIT 1;

-- Verificar posts
SELECT * FROM posts LIMIT 1;

-- Verificar post_likes
SELECT * FROM post_likes LIMIT 1;

-- Verificar que portfolios tiene is_public
SELECT id, name, is_public FROM portfolios LIMIT 1;
```

## Paso 3: Crear tu primer perfil manualmente (si no existe)

Si no tienes un perfil aún, créalo:

```sql
INSERT INTO user_profiles (user_id, username, display_name)
VALUES (
  'TU_USER_ID',  -- Reemplaza con tu user ID de auth.users
  'tu_username',
  'Tu Nombre'
);
```

Para obtener tu user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'tu@email.com';
```

## Paso 4: Refrescar la aplicación

Una vez ejecutadas las migraciones:
1. Refresca completamente la app (Ctrl + F5)
2. Ve a `/social`
3. Escribe un post
4. ¡Debería funcionar! 🎉

## Troubleshooting

### Error: "Could not find a relationship"
- Asegúrate de haber ejecutado TODAS las migraciones en orden
- Verifica que la tabla `user_profiles` existe
- Verifica que tienes un perfil creado para tu usuario

### Error: "Row level security policy violation"
- Las policies RLS se crean automáticamente con las migraciones
- Si tienes problemas, verifica que las políticas estén activas

### No aparece mi avatar/nombre
- El trigger automático crea el perfil al registrarte
- Si te registraste antes, necesitas crear el perfil manualmente (Paso 3)

## Características Disponibles

Una vez configurado, podrás:
- ✅ Crear posts (máx 500 caracteres)
- ✅ Ver feed de todos los usuarios
- ✅ Dar like/unlike
- ✅ Ver perfiles de usuarios
- ✅ Compartir portfolios públicos
- ✅ Click en nombres/avatares → ver perfil

