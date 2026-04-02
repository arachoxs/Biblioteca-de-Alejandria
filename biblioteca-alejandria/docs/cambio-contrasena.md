# Cambio de Contraseña

## Resumen

Se implementó el flujo seguro de cambio de contraseña accesible desde la Navbar y el perfil del usuario. El flujo verifica la contraseña actual antes de permitir el cambio, y cierra la sesión del usuario al finalizar.

---

## Decisiones de diseño

| Decisión | Justificación |
|---|---|
| Verificar contraseña actual vía `signInWithPassword` | Es la forma más directa de validar credenciales activas sin depender de tablas extras ni APIs externas. Previene cambios maliciosos si la sesión fue secuestrada. |
| Cerrar sesión al cambiar contraseña | Aprobado por el usuario. Invalida tokens activos y fuerza re-autenticación con la nueva contraseña. |
| Regla única: mínimo 8 caracteres | Regla simplificada aprobada por el usuario. Eliminadas las reglas de mayúsculas y números anteriores. |
| Renombrar `RecoveryState` → `AuthActionResult` | Tipo reutilizado en múltiples flujos auth. El nombre anterior era semánticamente incorrecto fuera de recuperación. |
| Action en `app/actions/authActions.ts` | El modal es transversal (Navbar + Perfil), no exclusivo de una ruta. Se sigue la convención definida en `docs/navbar-centralizada.md`. |

---

## Arquitectura (Action → Service → Model)

```
ChangePasswordModal (client)
  └→ changePasswordAction (app/actions/authActions.ts)
       └→ changePassword (services/auth/authService.ts)
            └→ updatePasswordWithVerification (models/authModel.ts)
                 ├─ getUser()
                 ├─ signInWithPassword() — verifica actual
                 ├─ updateUser({ password }) — actualiza
                 └─ signOut() — cierra sesión
```

## Funciones creadas / modificadas

| Archivo | Función | Tipo |
|---|---|---|
| `lib/validations/rules.ts` | `validatePasswordRule()` | **Nuevo** |
| `models/authModel.ts` | `updatePasswordWithVerification()` | **Nuevo** |
| `services/auth/authService.ts` | `changePassword()` | **Nuevo** |
| `app/actions/authActions.ts` | `changePasswordAction()` | **Modificado** |
| `lib/types/auth.ts` | `AuthActionResult` (antes `RecoveryState`) | **Renombrado** |
| `components/auth/ChangePasswordModal.tsx` | Componente completo | **Modificado** |
| `app/(auth)/register/actions.ts` | `validateRegistrationData()` | **Modificado** (usa regla centralizada) |
| `app/(auth)/password-recovery/actions.ts` | `resetPassword()` | **Modificado** (usa regla centralizada) |
