# ADR: Inserción de perfil de usuario usando cliente admin de Supabase

- **Fecha:** 2026-03-13
- **Estado:** Aceptado
- **Área:** Autenticación / Registro

---

## Contexto

Al completar el formulario de registro, se llama a `supabase.auth.signUp()` que crea la cuenta en `auth.users`. Sin embargo, las tablas `public.usuario` y `public.direccion` tienen **Row Level Security (RLS)** habilitado y no cuentan con políticas de `INSERT` para nuevos usuarios, ya que en ese momento el usuario aún no tiene una sesión activa válida.

Esto causaba que las inserciones fallaran silenciosamente y el perfil nunca se guardara en la base de datos pública.

---

## Decisión

Se creó una función `createAdminClient()` en `lib/supabase/server.ts` que instancia un cliente Supabase con la `SUPABASE_SERVICE_ROLE_KEY`. Este cliente bypasea el RLS y se usa **exclusivamente desde Server Actions** para insertar el perfil del usuario recién registrado.

El flujo resultante en `registerUser` (Server Action con `"use server"`) es:

1. `supabase.auth.signUp()` con el cliente regular (respeta los flujos de Auth de Supabase).
2. `adminClient.from('direccion').insert(...)` → obtiene el `id_direccion`.
3. `adminClient.from('usuario').insert(...)` → guarda el perfil con el `id` del usuario de Auth.

---

## Consecuencias

**Positivas:**
- El perfil se guarda de forma confiable sin necesidad de deshabilitar RLS ni crear políticas permisivas para anónimos.
- La `service_role` key nunca se expone al cliente (no tiene prefijo `NEXT_PUBLIC_`).
- El código se ejecuta íntegramente en el servidor gracias a `"use server"`.

**A tener en cuenta:**
- El `createAdminClient()` bypasea **todas** las reglas de RLS. Debe usarse solo para operaciones de sistema iniciadas desde el backend, nunca para consultas arbitrarias basadas en input del usuario.
- Requiere la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (no committear este valor).

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/supabase/server.ts` | Se añadió `createAdminClient()` |
| `app/(auth)/register/actions.ts` | Se añadieron los `INSERT` a `direccion` y `usuario` usando `adminClient` |
| `app/(auth)/register/RegistroForm.tsx` | Se concatena `direccion_detalle` a la dirección de Google Places |
