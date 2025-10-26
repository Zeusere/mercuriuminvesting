# 💬 Stock Rooms System - Implementation Guide

Sistema de chats comunitarios por ticker/acción para crear engagement y discusión en tiempo real.

## 📋 **Sprint 1 - Backend Base (✅ COMPLETADO)**

### **Implementado:**

#### **1. Base de Datos (4 tablas + triggers)**

**Archivo:** `supabase/migrations/009_stock_rooms.sql`

- ✅ **`stock_rooms`** - Salas de chat por ticker (creadas on-demand)
  - Symbol (ticker único)
  - Metadata del stock (nombre, logo, precio, cambio %)
  - Estadísticas (total_messages, total_members, active_members_24h)
  
- ✅ **`stock_room_messages`** - Mensajes en las salas
  - Contenido del mensaje
  - Tipo (text, image, link)
  - Likes count
  - Soft delete (deleted_at)
  
- ✅ **`stock_room_members`** - Membresía de usuarios
  - Favoritos (is_favorite)
  - Notificaciones
  - Tracking de actividad (last_read_message_id, last_seen_at)
  
- ✅ **`stock_room_message_likes`** - Likes en mensajes
  - Relación mensaje-usuario
  - Timestamp

**Triggers automáticos:**
- ✅ Actualizar estadísticas de sala al enviar/borrar mensajes
- ✅ Actualizar contador de miembros al unirse/salir
- ✅ Actualizar contador de likes
- ✅ Función para calcular active_members_24h

**Row Level Security:**
- ✅ Políticas RLS en todas las tablas
- ✅ Usuarios autenticados pueden crear mensajes
- ✅ Solo pueden editar/borrar sus propios mensajes
- ✅ Todos pueden ver mensajes y salas

---

#### **2. Tipos TypeScript**

**Archivo:** `types/stock-rooms.ts`

- ✅ `StockRoom` - Sala de chat
- ✅ `StockRoomMessage` - Mensaje con info de usuario
- ✅ `StockRoomMember` - Membresía
- ✅ `StockRoomMessageLike` - Like
- ✅ Tipos extendidos: `StockRoomWithStats`, `TrendingRoom`
- ✅ Request/Response types para APIs

---

#### **3. APIs Backend (6 endpoints)**

##### **A) Sala de Chat - `/api/stock-rooms/[symbol]`**

**GET** - Obtener o crear sala
- Si no existe, la crea automáticamente
- Obtiene info del stock de Finnhub (nombre, logo, precio)
- Retorna estado de membresía del usuario

**Archivo:** `app/api/stock-rooms/[symbol]/route.ts`

```typescript
GET /api/stock-rooms/AAPL
Response: {
  room: { id, symbol, company_name, current_price, ... },
  is_member: boolean,
  is_favorite: boolean,
  membership: { ... } | null
}
```

---

##### **B) Unirse/Salir - `/api/stock-rooms/[symbol]/join`**

**POST** - Unirse a una sala
- Crea membresía automáticamente
- Si ya es miembro, retorna membresía existente

**DELETE** - Salir de una sala
- Elimina membresía
- Decrementa contador de miembros

**Archivo:** `app/api/stock-rooms/[symbol]/join/route.ts`

```typescript
POST /api/stock-rooms/AAPL/join
Body: { notifications_enabled?: boolean }
Response: { message, membership }

DELETE /api/stock-rooms/AAPL/join
Response: { message }
```

---

##### **C) Favoritos - `/api/stock-rooms/[symbol]/favorite`**

**POST** - Toggle favorito
- Marca/desmarca sala como favorita
- Solo miembros pueden marcar como favorito

**Archivo:** `app/api/stock-rooms/[symbol]/favorite/route.ts`

```typescript
POST /api/stock-rooms/AAPL/favorite
Response: { 
  message,
  is_favorite: boolean,
  membership: { ... }
}
```

---

##### **D) Mensajes - `/api/stock-rooms/[symbol]/messages`**

**GET** - Obtener mensajes paginados
- Paginación cursor-based (before_id, after_id)
- Retorna mensajes con info de usuario
- Indica cuáles ha dado like el usuario actual
- Límite configurable (default: 50)

**POST** - Enviar mensaje
- Auto-crea sala si es el primer mensaje
- Auto-join del usuario
- Validación de contenido (max 2000 chars)
- Retorna mensaje con info del usuario

**Archivo:** `app/api/stock-rooms/[symbol]/messages/route.ts`

```typescript
GET /api/stock-rooms/AAPL/messages?limit=50&before_id=uuid
Response: {
  messages: [...],
  has_more: boolean,
  next_cursor: string | null
}

POST /api/stock-rooms/AAPL/messages
Body: { 
  content: string, 
  message_type?: 'text' | 'image' | 'link' 
}
Response: { 
  message: { 
    id, content, created_at, 
    user: { username, avatar_url },
    is_liked_by_me: false 
  } 
}
```

---

##### **E) Trending - `/api/stock-rooms/trending`**

**GET** - Salas más activas
- Ordenadas por: active_members_24h > total_messages > last_message_at
- Límite configurable (default: 10)
- Solo salas con actividad (total_messages > 0)

**Archivo:** `app/api/stock-rooms/trending/route.ts`

```typescript
GET /api/stock-rooms/trending?limit=10
Response: {
  rooms: [
    { 
      symbol, company_name, current_price, price_change_pct,
      total_messages, active_members_24h, last_message_at 
    }
  ]
}
```

---

##### **F) Mis Favoritos - `/api/stock-rooms/my-favorites`**

**GET** - Salas favoritas del usuario
- Requiere autenticación
- Incluye contador de mensajes no leídos
- Ordenadas por last_seen_at (más reciente primero)

**Archivo:** `app/api/stock-rooms/my-favorites/route.ts`

```typescript
GET /api/stock-rooms/my-favorites
Response: {
  favorites: [
    {
      id, room_id, is_favorite, last_seen_at,
      room: { symbol, company_name, ... },
      unread_count: number
    }
  ]
}
```

---

## 🎨 **Sprint 2 - UI Básica (✅ COMPLETADO)**

### **Componentes Creados:**

#### **1. Componentes de Chat:**

**`components/stock-rooms/StockRoomMessage.tsx`** ✅
- Mensaje individual con avatar y username
- Timestamp con formato "time ago"
- Botón de like con contador
- Menú de opciones para mensajes propios (delete)
- Indicador de "editado"
- Hover states y transiciones

**`components/stock-rooms/MessageInput.tsx`** ✅
- Textarea con auto-resize (min 48px, max 150px)
- Validación de longitud (max 2000 chars)
- Contador de caracteres
- Hint de "Enter to send, Shift+Enter for new line"
- Loading state mientras envía
- Focus automático después de enviar

**`components/stock-rooms/StockRoomChat.tsx`** ✅
- Componente principal del chat
- Header con logo, precio, y cambio % del día
- Estadísticas (miembros, mensajes)
- Botón de favorito (star)
- Lista de mensajes con scroll
- Auto-scroll al último mensaje
- Subscripción real-time con Supabase
- Estado vacío cuando no hay mensajes
- Optimistic updates para likes

#### **2. Sidebars para Social:**

**`components/stock-rooms/TrendingStockRooms.tsx`** ✅
- Top 10 salas más activas
- Muestra: símbolo, precio, cambio %, mensajes, miembros activos
- Ordenadas por trending (active_members_24h)
- Links directos a cada sala
- Loading skeleton
- Estado vacío

**`components/stock-rooms/MyFavoriteRooms.tsx`** ✅
- Salas favoritas del usuario
- Badge de mensajes no leídos
- Logo del stock
- Precio actual y cambio %
- Link a "Browse stocks"
- Requiere login (muestra mensaje si no está autenticado)

#### **3. Página Principal:**

**`app/stock-rooms/[symbol]/page.tsx`** ✅
- Página Next.js para ruta `/stock-rooms/AAPL`
- Server component que pasa datos al client component
- Full screen layout

#### **4. Integraciones:**

**`components/StockDetail.tsx`** ✅ (modificado)
- Agregado botón "Join {SYMBOL} Community"
- Colocado después del header, antes de stats
- Icono de MessageSquare
- Link directo a `/stock-rooms/{symbol}`

**`components/social/SocialFeed.tsx`** ✅ (modificado)
- Layout de 3 columnas (12 grid)
- Sidebar izquierdo (col-span-3): MyFavoriteRooms
- Contenido central (col-span-6): Feed social existente
- Sidebar derecho (col-span-3): TrendingStockRooms
- Responsive: sidebars ocultos en mobile (<lg)

---

## 🎯 **Características Implementadas:**

### **Real-time:**
- ✅ Mensajes aparecen instantáneamente con Supabase Realtime
- ✅ Subscripción a canal por room_id
- ✅ Auto-scroll cuando usuario está cerca del bottom

### **UX/UI:**
- ✅ Auto-join al enviar primer mensaje
- ✅ Optimistic updates para likes
- ✅ Loading skeletons
- ✅ Estados vacíos informativos
- ✅ Hover states y transiciones
- ✅ Dark mode completo
- ✅ Responsive design

### **Seguridad:**
- ✅ Solo el autor puede borrar sus mensajes
- ✅ Login requerido para enviar mensajes
- ✅ Validación de contenido (max 2000 chars)

---

## 📂 **Archivos del Sprint 2:**

```
✅ components/stock-rooms/StockRoomMessage.tsx
✅ components/stock-rooms/MessageInput.tsx
✅ components/stock-rooms/StockRoomChat.tsx
✅ components/stock-rooms/TrendingStockRooms.tsx
✅ components/stock-rooms/MyFavoriteRooms.tsx
✅ app/stock-rooms/[symbol]/page.tsx
✅ components/StockDetail.tsx (modificado)
✅ components/social/SocialFeed.tsx (modificado)
```

---

## 🚀 **Próximos Pasos - Sprint 3 (Polish & Features)**

### **Funcionalidades Pendientes:**

---

## 📊 **Flujo de Usuario Completo**

### **Escenario 1: Buscar acción y unirse al chat**

```
Usuario en /stocks 
  → Busca "Apple"
  → Ve detalles de AAPL
  → Click "Join AAPL Community"
  → POST /api/stock-rooms/AAPL/join
  → Redirect a /stock-rooms/AAPL
  → GET /api/stock-rooms/AAPL/messages
  → Ve chat en tiempo real
```

### **Escenario 2: Enviar primer mensaje en ticker nuevo**

```
Usuario escribe mensaje en /stock-rooms/DOGE
  → POST /api/stock-rooms/DOGE/messages
  → Backend:
    1. No existe sala? → Crear stock_rooms(symbol='DOGE')
    2. Fetch precio de Finnhub
    3. Crear mensaje
    4. Auto-join usuario
  → Mensaje aparece en chat
  → Sala ahora existe y visible en trending
```

### **Escenario 3: Ver trending y marcar favoritos**

```
Usuario en /social
  → Ve sidebar "Trending Rooms"
  → GET /api/stock-rooms/trending
  → Click en "TSLA"
  → Entra al chat
  → POST /api/stock-rooms/TSLA/favorite
  → Aparece en "My Rooms" (sidebar izquierdo)
```

---

## 🔧 **Setup en Desarrollo**

### **1. Ejecutar migración SQL**

```bash
# En Supabase Dashboard > SQL Editor
# Ejecutar: supabase/migrations/009_stock_rooms.sql
```

### **2. Verificar environment variables**

```env
# .env.local
FINNHUB_API_KEY=xxx  # Para obtener info de stocks
```

### **3. Reiniciar servidor**

```bash
pnpm dev
```

### **4. Probar APIs**

```bash
# Crear/obtener sala
curl http://localhost:3000/api/stock-rooms/AAPL

# Enviar mensaje (requiere auth)
curl -X POST http://localhost:3000/api/stock-rooms/AAPL/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message"}'

# Ver trending
curl http://localhost:3000/api/stock-rooms/trending
```

---

## 🎯 **Funcionalidades Futuras (Opcional)**

### **Sprint 3 - Real-time & Polish:**
- [ ] Supabase Realtime para mensajes instantáneos
- [ ] "Usuario está escribiendo..." indicator
- [ ] Infinite scroll hacia arriba (mensajes antiguos)
- [ ] Likes en mensajes

### **Sprint 4 - Advanced Features:**
- [ ] Menciones @username con autocomplete
- [ ] Rich content (URLs con preview, imágenes)
- [ ] Reacciones emoji (no solo likes)
- [ ] Threads/respuestas a mensajes
- [ ] Moderación (reportar, bannear)
- [ ] Búsqueda dentro del chat

### **Sprint 5 - Social Integration:**
- [ ] Compartir mensajes en feed social
- [ ] Notificaciones push
- [ ] Badges de "Top Contributor"
- [ ] Leaderboard de usuarios más activos
- [ ] Bot de AI para responder preguntas sobre stocks

---

## ✅ **Validación de Sprint 1**

- ✅ Migraciones SQL ejecutables sin errores
- ✅ Tipos TypeScript completos y tipados
- ✅ 6 APIs funcionando correctamente
- ✅ RLS policies configuradas
- ✅ Triggers automáticos funcionando
- ✅ 0 errores de linting
- ✅ Listo para implementar UI

**Backend completamente funcional y listo para el frontend.** 🚀

---

## 📝 **Notas de Implementación**

### **Performance:**
- Índices optimizados para queries frecuentes
- Paginación cursor-based (más eficiente que offset)
- Soft delete para mensajes (auditoría)

### **Seguridad:**
- RLS en todas las tablas
- Validación de contenido (max 2000 chars)
- Rate limiting recomendado (10 msg/min por usuario)

### **Escalabilidad:**
- Salas creadas on-demand (no pre-crear todo el mercado)
- Cache de precios (actualizar cada 15min, no en cada request)
- Active members calculation (ejecutar cada hora vía cron)

### **UX:**
- Auto-join al enviar primer mensaje
- Mensajes ordenados cronológicamente (más antiguo primero)
- Scroll automático al último mensaje
- Unread count en favoritos

---

**¿Listo para Sprint 2 (UI)?** 
Siguiente paso: Crear componentes React para visualizar y usar estas APIs.

