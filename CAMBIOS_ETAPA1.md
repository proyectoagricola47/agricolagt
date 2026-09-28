# Etapa 1 — cambios aplicados

Módulos M-01, M-02, M-03 y M-11 del documento «Funcionalidades pendientes del sistema AgrícolaGT».

## Antes de correr la aplicación

Ejecutar **una sola vez** el archivo `supabase/migracion_etapa1.sql` en el panel de
Supabase: *SQL Editor → New query → pegar el contenido → Run*.

Agrega la columna `phone` a la tabla `users`, crea la tabla `notifications`
y deja configuradas sus políticas de seguridad.

## M-01 · Contacto en el perfil

- `src/model/user.ts` — campo `phone`
- `src/modules/users/services/userService.ts` — se lee y se guarda `phone`
- `src/modules/users/pages/profile.tsx` — campo «Teléfono de contacto»

## M-02 · Registro e inicio de sesión con correo

- `src/context/AuthContext.tsx` — `signInWithEmail`, `signUpWithEmail`, `resetPassword`
  y mensajes de error traducidos al español
- `src/modules/auth/pages/login.tsx` — formulario de correo y contraseña, recuperación
  de contraseña y acceso con Google
- `src/modules/auth/pages/register.tsx` — nueva pantalla de registro
- Ruta pública `/register`

Si en Supabase está activada la confirmación por correo, el registro muestra el aviso
correspondiente; si está desactivada, entra directo y crea la fila en `users`.

## M-03 · Notificaciones de alertas agrícolas

- `src/model/notification.ts`
- `src/modules/notifications/services/notificationService.ts`
- `src/modules/notifications/pages/notificationsPage.tsx`
- `src/modules/weathers/pages/weatherPage.tsx` — procesa las alertas al consultar el clima
- Campana con contador de no leídas en `TopNav.tsx`
- Ruta privada `/notificaciones`

Las alertas de severidad media y alta se guardan en el historial; las de severidad
alta además se muestran como notificación del navegador. Un índice único evita
repetir la misma alerta al mismo usuario el mismo día. Si el permiso está denegado,
la aplicación sigue funcionando y las alertas quedan solo en el historial.

## M-11 · Mercado

- `src/modules/market/services/marketService.ts`
- `src/modules/market/components/ListingCard.tsx`
- `src/modules/market/pages/marketPage.tsx`
- Ruta pública `/mercado` y enlace en el menú

Reutiliza la tabla `posts`: muestra las publicaciones marcadas con el tipo
**Comercial** junto al nombre, la ubicación y el teléfono del agricultor.
No requiere tablas nuevas.

## Verificación

```
npm install
npx tsc -b        # sin errores
npm run build     # compila correctamente
```
