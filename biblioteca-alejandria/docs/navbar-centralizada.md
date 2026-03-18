# Centralización de la Navbar

## Resumen

Se reemplazaron los componentes estáticos `RootNavbar` y `AdminNavbar` por un **componente único `Navbar`** que determina dinámicamente qué elementos mostrar según el rol del usuario autenticado (`ROOT`, `ADMINISTRADOR`, `CLIENTE` o `VISITANTE`).

---

## Justificación de los cambios

### 1. `models/authModel.ts` — nuevas funciones centralizadas

| Función | Propósito |
|---|---|
| `getCurrentUserRole()` | Obtiene el rol del usuario desde `app_metadata.role`. Retorna el enum `Rol` o `"VISITANTE"` si no hay sesión. |
| `getCurrentUserEmail()` | Retorna el email del usuario actual o `null`. |
| `globalSignOutModel()` | Ejecuta `supabase.auth.signOut({ scope: "global" })` para invalidar la sesión en **todos** los dispositivos y redirige a `/`. |

**¿Por qué aquí y no en el componente?**
Se sigue el patrón MVC ya establecido en el proyecto: toda la interacción con Supabase Auth se centraliza en `models/authModel.ts`. Esto evita acoplar los componentes a la estructura interna de `app_metadata` y facilita el mantenimiento si la fuente del rol cambia a futuro.

### 2. `app/actions/authActions.ts` — Server Action

Archivo nuevo con la acción `globalSignOutAction()`, que delega a `globalSignOutModel()`. Se usa `"use server"` para que el cliente pueda invocarla de forma segura sin exponer lógica del servidor.

### 3. `components/Navbar.tsx` — Server Component

Componente servidor que:
- Llama a `getCurrentUserRole()` y `getCurrentUserEmail()` en paralelo con `Promise.all` para evitar cascadas de datos.
- Pasa el rol y email al `NavbarClient` envuelto en `<Suspense>` con un skeleton de carga para prevenir la de-optimización CSR (causada por el uso de `useSearchParams` en el buscador del cliente).

### 4. `components/NavbarClient.tsx` — Client Component

Componente cliente (`"use client"`) que renderiza la interfaz según el rol recibido:

| Rol | Logo lleva a | Botón de panel | Menú desplegable | Acción adicional |
|---|---|---|---|---|
| `ROOT` | `/panel-root` | "Panel Root" | "Cambiar contraseña" + "Cerrar sesión en todos" | — |
| `ADMINISTRADOR` | `/panel-admin` | "Panel Administración" | "Ver perfil" + "Cerrar sesión en todos" | — |
| `CLIENTE` | `/` | — | "Ver perfil" + "Cerrar sesión en todos" | — |
| `VISITANTE` | `/` | — | No hay menú | Botón "Iniciar sesión" |

**Barra de búsqueda global**: Visible centrada para todos los roles (con visibilidad optimizada en móviles). Actualiza los query params (`?q=...`) y navega a la página principal. Se ha ensanchado (`max-w-xl`) para una mejor UX en escritorio.

### 5. Páginas modificadas

- `app/(panel)/panel-root/page.tsx`: `<RootNavbar />` → `<Navbar />`
- `app/(panel)/panel-admin/page.tsx`: `<AdminNavbar />` → `<Navbar />`
- `app/page.tsx`: Se añadió `<Navbar />` para visitantes y clientes.

### 6. Archivos eliminados

- `components/RootNavbar.tsx` — obsoleto.
- `components/AdminNavbar.tsx` — obsoleto.

---

## Buenas prácticas aplicadas

- **Suspense Boundary**: Previene CSR bailout por `useSearchParams` (recomendación de Next.js 15+).
- **Server Component + Client Component**: La resolución del rol ocurre en el servidor; solo los datos serializables (strings) se pasan al cliente.
- **Accesibilidad**: El menú desplegable mantiene `role="menu"`, `aria-haspopup`, `aria-expanded`, y cierre con `Escape`.
- **Principio de responsabilidad única**: El componente no conoce `app_metadata`; delega al modelo.
