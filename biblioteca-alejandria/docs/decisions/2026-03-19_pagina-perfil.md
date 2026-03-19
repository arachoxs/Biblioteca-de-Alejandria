# Página de Perfil de Usuario — Documentación Técnica

**Fecha:** 2026-03-19  
**Rama:** `feat/edit-profile`

---

## Descripción

Se implementó la página `/perfil` que permite a los usuarios autenticados ver y editar su información personal. Los campos DNI y Correo Electrónico no son editables. Los usuarios con rol `CLIENTE` tienen acceso adicional a módulos de preferencias literarias y gestión financiera.

## Decisiones Arquitectónicas

### 1. Composición sobre Configuración

En lugar de crear un formulario monolítico con flags `mode="register" | "profile"`, se extrajo un componente `PersonalDataFields` que renderiza solo la grilla de campos de datos personales. Ambos formularios (`RegistroForm` y `PerfilClient`) componen este componente internamente. Esto evita el anti-patrón de "god component" y mantiene cada formulario como dueño de su propia lógica de submit.

### 2. Separación de Fuentes de Datos

Los datos del perfil provienen de múltiples fuentes:

| Dato | Fuente |
|------|--------|
| dni, nombres, apellidos, etc. | Tabla `usuario` |
| dirección | Tabla `direccion` (FK `id_direccion`) |
| correo | `auth.users.email` |
| username | `auth.users.user_metadata.username` |
| role | `auth.users.app_metadata.role` |

El servicio `profileService.ts` combina estas fuentes en un objeto unificado `UserProfileData`.

### 3. Consistencia con `createAdminClient`

Todas las funciones de modelo usan `createAdminClient` (service_role key que bypasea RLS). Se mantuvo esta consistencia en las nuevas funciones de modelo, verificando la autenticación server-side.

### 4. Tipo Dedicado para Actualización

Se creó `ProfileUpdatePayload` en `lib/types/profile.ts` separado de `PersonalData` para evitar confusiones. Excluye campos como `dni` (no editable) y agrega campos de dirección.

### 5. Modales como Shells Visuales

Los modales de Preferencias Literarias y Gestión Financiera son implementaciones front-end con datos placeholder, preparados para empezar a consumir las tablas `preferencia_categoria` y `tarjeta` en futuras iteraciones.

### 6. Ruta de Primer Nivel

`/perfil` no pertenece a `(auth)` (flujos no autenticados) ni a `(panel)` (paneles administrativos). Se ubicó como ruta de primer nivel accesible por cualquier usuario autenticado.

---

## Archivos Creados

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `lib/types/profile.ts` | Tipos | `UserProfileData`, `ProfileUpdatePayload`, `ProfileUpdateResponse` |
| `services/profile/profileService.ts` | Servicio | Orquesta `fetchProfile` y `updateProfile` |
| `components/PersonalDataFields.tsx` | Componente | Grilla reutilizable de campos de datos personales |
| `components/profile/ClientModules.tsx` | Componente | Tarjetas + modales de Preferencias y Finanzas (solo CLIENTE) |
| `app/perfil/page.tsx` | Página | Server component con auth guard |
| `app/perfil/PerfilClient.tsx` | Componente | Client component con el formulario de edición |
| `app/perfil/actions.ts` | Server Action | Validación y actualización del perfil |

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `models/userModel.ts` | Agregadas funciones `getUserProfileById` y `updateUserProfile` |
| `models/addressModel.ts` | Agregada función `updateAddress` |
| `components/GoogleAutocomplete.tsx` | Agregado prop `defaultValue` |
| `app/(auth)/register/RegistroForm.tsx` | Refactorizado para componer `PersonalDataFields` |

---

## Flujo de Datos

```
[page.tsx] Server Component
  ├── getCurrentUser() → sesión autenticada
  ├── fetchProfile(userId) → UserProfileData
  └── Renderiza <PerfilClient>

[PerfilClient.tsx] Client Component
  ├── <PersonalDataFields> → campos editables
  ├── Correo (disabled)
  ├── Botones: Cancelar / Guardar
  └── <ClientModules> (si CLIENTE)

[actions.ts] Server Action
  ├── Validación de campos
  └── profileService.updateProfile()
        ├── checkUsernameExists() (si cambió)
        ├── updateAddress()
        ├── updateUserProfile()
        └── admin.updateUserById() (username en auth)
```
