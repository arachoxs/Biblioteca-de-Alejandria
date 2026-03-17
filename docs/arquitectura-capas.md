# Arquitectura de Capas: Service-Repository

## Visión General

El proyecto utiliza una arquitectura de **tres capas** para separar responsabilidades:

```
┌─────────────────────────────────────────┐
│   Actions (app/(auth)/*/actions.ts)     │  ← Validación de entrada
├─────────────────────────────────────────┤
│   Services (services/auth/*)            │  ← Lógica de negocio y orquestación
├─────────────────────────────────────────┤
│   Models (models/*)                     │  ← Operaciones atómicas (CRUD / Auth)
└─────────────────────────────────────────┘
```

## Capas

### 1. Models — Repositorios Atómicos

Cada model es responsable de **una sola fuente de datos**. Expone operaciones
CRUD simples sin lógica de negocio.

| Archivo | Responsabilidad |
|---|---|
| `models/authModel.ts` | Operaciones de Supabase Auth: `signUp`, `signIn`, `setUserRole`, `deleteAuthUser`, recovery |
| `models/userModel.ts` | CRUD tabla `usuario`: verificación de unicidad (DNI, username), creación de perfil |
| `models/addressModel.ts` | CRUD tabla `direccion`: crear y eliminar direcciones |

### 2. Services — Orquestadores de Negocio

Coordinan múltiples models para ejecutar un caso de uso completo.
Manejan **rollback** cuando un paso intermedio falla.

| Archivo | Caso de uso |
|---|---|
| `services/auth/registrationService.ts` | Registro completo (Auth → Dirección → Perfil) con rollback automático |
| `services/auth/recoveryService.ts` | Recuperación de contraseña (envío OTP → verificación → reset) |

### 3. Actions — Capa de Presentación (Server Actions)

Reciben datos del frontend, validan la entrada y delegan al service correspondiente.
No contienen lógica de negocio ni acceden directamente a la base de datos.

| Archivo | Función |
|---|---|
| `app/(auth)/login/actions.ts` | Validación de login → `authModel.signIn` |
| `app/(auth)/register/actions.ts` | Validación de registro → `registrationService.register` |
| `app/(auth)/password-recovery/actions.ts` | Validación de recovery → `recoveryService.*` |

## Reglas

1. **Los Actions nunca importan de `models/` directamente**, excepto para operaciones
   atómicas que no requieren orquestación (como `signIn` en login).
2. **Los Models nunca llaman a otros models.** Si se necesita coordinación,
   eso es responsabilidad de un Service.
3. **Los Services nunca acceden a Supabase directamente.** Siempre delegan
   a un model.
4. **El rollback es responsabilidad del Service.** Los models no saben cómo
   revertir operaciones de otros models.

## Ejemplo: Flujo de Registro

```
registerUser (action)
  │
  ├── validateRegistrationData()     ← Validación de entrada
  │
  └── register() (service)
        │
        ├── checkDniExists()         ← userModel
        ├── checkUsernameExists()    ← userModel
        ├── signUp()                 ← authModel
        ├── setUserRole()            ← authModel (solo si rol ≠ CLIENTE)
        ├── createAddress()          ← addressModel
        └── createUserProfile()      ← userModel
             │
             └── (si falla: rollback automático)
                  ├── deleteAuthUser()   ← authModel
                  └── deleteAddress()    ← addressModel
```
