# Completar Perfil Administrador (CU-54)

**Fecha:** 2026-03-22  
**Estado:** Implementado

## Contexto

Cuando Root crea un Administrador, solo se crea la entrada en `auth.users` con credenciales temporales. El administrador no tiene datos personales ni contraseña propia. Necesita un flujo forzoso de onboarding antes de acceder al panel.

## Decisiones

### 1. Flag `profile_complete` en `app_metadata` (no `user_metadata`)

- `app_metadata` solo es modificable por el Admin/Service client del servidor.
- `user_metadata` es modificable por el propio usuario, lo que permitiría saltarse el onboarding.
- El flag se lee del JWT en el proxy, sin round-trip a DB en cada request.

### 2. Guard en `proxy.ts` (middleware)

- Se evalúa después del check de rol (sección 3 del proxy).
- Admin sin `profile_complete` → redirect forzoso a `/completar-perfil`.
- Admin con `profile_complete` en `/completar-perfil` → redirect a `/panel-admin`.
- Otros roles en `/completar-perfil` → redirect a home.

### 3. Cambio de contraseña sin verificar la actual

- Al ser credenciales temporales generadas por el sistema, no tiene sentido pedir la contraseña actual.
- Se usa `supabase.auth.updateUser({ password })` directamente desde la sesión del admin.
- No se hace `signOut()` al final (a diferencia de `resetPassword()`): se necesita mantener la sesión para redirigir al panel.

### 4. Migración de backfill

- Admins existentes con perfil en `public.usuario` reciben `profile_complete: true` vía migración SQL.
- Debe ejecutarse antes de activar el guard en producción.

## Archivos relacionados

| Archivo | Rol |
|---|---|
| `lib/supabase/proxy.ts` | Guard de onboarding |
| `app/completar-perfil/` | Página, componente y action |
| `services/profile/completeProfileService.ts` | Orquestador |
| `lib/validations/profile.ts` | Validaciones compartidas |
| `supabase/migrations/20260322_backfill_profile_complete.sql` | Backfill |
