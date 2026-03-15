# Implementación: Recuperación de contraseña (CU-04)

- **Fecha:** 2026-03-15
- **Estado:** Implementado
- **Área:** Autenticación / Recuperación de contraseña
- **Caso de uso:** CU-04

---

## Contexto

El sistema necesitaba un flujo completo de recuperación de contraseña para usuarios que olvidan sus credenciales. La pantalla de recuperación ya existía como prototipo UI (3 pasos: correo → código → nueva contraseña) pero sin ninguna lógica de backend.

Se evaluaron dos enfoques:

1. **OTP custom con tabla en BD** — Tabla `password_reset_codes`, código generado manualmente, control total.
2. **Supabase Auth nativo con OTP** — Usar `resetPasswordForEmail()` + `verifyOtp()` + `updateUser()`, delegando la generación y validación del código a Supabase.

---

## Decisión

Se eligió **Supabase Auth nativo con OTP de 6 dígitos** por las siguientes razones:

- **Menos superficie de ataque**: no se almacenan códigos en una tabla propia; Supabase gestiona la expiración y los intentos internamente.
- **Menos código de infraestructura**: no se necesita migración SQL, cron de limpieza de códigos expirados, ni lógica de rate-limiting manual.
- **Consistencia**: el resto de la autenticación (signup, login) ya se delega a Supabase Auth.
- **Compatibilidad con el CU-04**: al configurar el template de email de Supabase con `{{ .Token }}`, el sistema envía un código numérico de 6 dígitos en lugar de un magic link, manteniendo el flujo original del caso de uso.

### Requisito de configuración

Para que Supabase envíe un código de 6 dígitos (en vez de un enlace), se debe editar el template **Reset Password** en el Dashboard de Supabase (*Authentication → Email Templates*) para usar la variable `{{ .Token }}`:

```html
<p style="font-size: 24px; font-family: monospace; font-weight: bold;">
  {{ .Token }}
</p>
```

El SMTP de Maileroo se configuró directamente en el Dashboard de Supabase (*Project Settings → Authentication → SMTP*), no a través de la aplicación.

---

## Flujo implementado

```
Paso 1 (Correo)
  → Usuario ingresa email
  → Server Action: sendRecoveryCode()
  → Llama a supabase.auth.resetPasswordForEmail(email)
  → Supabase envía email con código OTP de 6 dígitos
  → Respuesta genérica (no revela si el correo existe)

Paso 2 (Código)
  → Usuario ingresa código de 6 dígitos
  → Server Action: verifyRecoveryCode()
  → Llama a supabase.auth.verifyOtp({ email, token, type: 'recovery' })
  → Si OK: Supabase crea sesión temporal de recovery
  → Si error: mensaje "código incorrecto" o "código expirado"

Paso 3 (Nueva contraseña)
  → Usuario ingresa nueva contraseña + confirmación
  → Server Action: resetPassword()
  → Valida: coincidencia, longitud ≥ 8, mayúscula, número
  → Verifica sesión activa con supabase.auth.getUser()
  → Llama a supabase.auth.updateUser({ password })
  → Cierra sesión con supabase.auth.signOut()
  → Redirige a /login
```

---

## Archivos creados/modificados

| Archivo | Cambio |
|---|---|
| `app/(auth)/password-recovery/actions.ts` | **Creado.** Tres Server Actions: `sendRecoveryCode`, `verifyRecoveryCode`, `resetPassword`. |
| `app/(auth)/password-recovery/PasswordRecoveryForm.tsx` | **Refactorizado.** Conectados los 3 pasos a los Server Actions. Agregado: loading states, manejo de errores, reenvío de código con cooldown de 60s. |

---

## Buenas prácticas aplicadas

| Práctica | Detalle |
|---|---|
| `rendering-hoist-jsx` | Iconos SVG y constantes extraídos fuera del componente como variables de módulo. |
| `rerender-functional-setstate` | El cooldown del reenvío usa `setResendCooldown((prev) => prev - 1)` para evitar closures stale. |
| `js-early-exit` | Validaciones en los Server Actions retornan temprano ante cada error. |
| `server-serialization` | Los Server Actions devuelven solo `{ error?, success?, message? }`, minimizando datos serializados. |
| Seguridad CU-04 4a | `sendRecoveryCode` siempre devuelve éxito, sin revelar si el correo existe en la BD. |
| Validación dual | Validación tanto en cliente (UX rápida) como en servidor (seguridad). |

---

## Consecuencias

**Positivas:**
- El flujo completo de 3 pasos funciona sin tablas adicionales ni migraciones.
- El componente `CodeInput` existente se reutiliza tal cual.
- La expiración del código y el rate limiting son manejados por Supabase.

**A tener en cuenta:**
- La expiración del OTP es configurable en el Dashboard de Supabase (por defecto varía según plan). Si se necesita un tiempo específico, ajustar en *Authentication → Rate Limits*.
- El `signOut()` al final del paso 3 fuerza al usuario a re-loguearse. Esto es intencional para confirmar que la nueva contraseña funciona.
- El servicio de email `lib/services/email.ts` (Nodemailer) **no se usa** en este flujo — los correos los envía Supabase directamente vía el SMTP configurado en su Dashboard.
