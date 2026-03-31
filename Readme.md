# 📚 Biblioteca de Alejandría

Sistema de gestión y e-commerce de libros en línea, desarrollado con Next.js y Supabase. El proyecto implementa flujos completos de autenticación multi-rol, gestión de perfiles, paneles administrativos y auditoría.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|:---|:---|:---|
| **Next.js** | `16.1.6` | Framework full-stack (App Router, Server Components, Server Actions) |
| **React** | `19.2.3` | UI reactiva |
| **TypeScript** | `^5` | Tipado estático |
| **Tailwind CSS** | `^4.2.1` | Estilos (configurado con `@theme` nativo de v4) |
| **Supabase** | `^2.99.1` + `@supabase/ssr ^0.9.0` | Auth, base de datos Postgres, RLS |
| **pnpm** | — | Gestor de paquetes |
| **Nodemailer** | `^8.0.2` | Envío de emails via Gmail SMTP |
| **Lucide React** | `^0.577.0` | Iconografía |

---

## 🎨 Design System

La paleta de colores está definida como tokens en `app/globals.css` bajo `@theme`. **No usar códigos hexadecimales directamente en componentes.**

| Token Tailwind | Hex | Uso |
|:---|:---|:---|
| `brand-primary` | `#49111C` | Botones de acción, encabezados, headers |
| `brand-secondary` | `#5E503F` | Navegación, elementos secundarios |
| `brand-accent` | `#A9927D` | Detalles, hovers, bordes decorativos |
| `brand-bg` | `#F2F4F3` | Fondo principal de la aplicación |
| `brand-text` | `#0A0908` | Texto de lectura |

**Fuentes tipográficas** (configuradas en `lib/fonts.ts`):
- `--font-sans` → **Geist Sans** (texto general)
- `--font-mono` → **Geist Mono** (código / monospace)
- `--font-display` → **Cormorant Garamond** (títulos y display)

---

## 🏗️ Arquitectura

El proyecto implementa una **arquitectura de cuatro capas** (Service-Repository) adaptada a Next.js. Cada capa tiene una responsabilidad única y no puede saltear niveles.

```
┌──────────────────────────────────────────────────────────┐
│  View       — components/  ("use client")                │
│             Renderiza UI, llama a Server Actions         │
├──────────────────────────────────────────────────────────┤
│  Actions    — app/**/actions.ts  ("use server")          │
│             Valida y sanitiza entrada, delega a Service  │
├──────────────────────────────────────────────────────────┤
│  Services   — services/**/                               │
│             Orquesta casos de uso, maneja rollback       │
├──────────────────────────────────────────────────────────┤
│  Models     — models/**/                                 │
│             Operaciones atómicas CRUD / Auth             │
└──────────────────────────────────────────────────────────┘
                           ↓
                  Supabase (Postgres + Auth)
```

### Reglas de la arquitectura

1. **Actions** nunca importan directamente de `models/`, excepto operaciones atómicas sin orquestación (ej. `signIn` en login).
2. **Models** nunca llaman a otros Models. Si se necesita coordinación, eso es responsabilidad de un Service.
3. **Services** nunca acceden a Supabase directamente. Siempre delegan a un Model.
4. **El rollback** es responsabilidad del Service. Los Models no revierten operaciones ajenas.
5. **Tipos compartidos** se definen en `lib/types/`, **nunca** inline en un Model o Action.

---

## 📁 Estructura de Carpetas

```
biblioteca-alejandria/
├── app/
│   ├── (auth)/                     # Rutas de autenticación (URL limpia, sin prefijo)
│   │   ├── login/                  # Formulario de login + actions
│   │   ├── register/               # Registro multi-paso (Stepper 2 pasos) + actions
│   │   └── password-recovery/      # Recuperación de contraseña (Stepper 3 pasos) + actions
│   ├── (panel)/                    # Paneles administrativos
│   │   ├── panel-root/             # Panel SuperAdmin (ROOT)
│   │   │   ├── administradores/    # Gestión de administradores
│   │   │   └── auditoria/          # Historial de auditoría
│   │   └── panel-admin/            # Panel Administrador
│   ├── actions/                    # Server Actions globales (signOut, changePassword)
│   ├── completar-perfil/           # Onboarding obligatorio para admins (primer login)
│   ├── perfil/                     # Perfil del usuario (CLIENTE y ADMINISTRADOR)
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── globals.css                 # Tailwind @theme + animaciones globales
│
├── components/
│   ├── ui/                         # Primitivas: Alert, Button, Input, Select, Modal,
│   │                               #   Stepper, CodeInput, Table, FilterActionBar, etc.
│   ├── auth/                       # ChangePasswordModal
│   ├── profile/                    # ClientModules (secciones del perfil)
│   ├── Navbar.tsx                  # Server Component (obtiene sesión, delega a NavbarClient)
│   ├── NavbarClient.tsx            # Client Component (menú, avatar, logout)
│   ├── MobileMenu.tsx              # Menú hamburguesa con animación slide-in
│   ├── GoogleAutocomplete.tsx      # Autocompletado de dirección (Google Places API)
│   ├── PersonalDataFields.tsx      # Campos reutilizables de datos personales
│   └── ActionCard.tsx              # Card de navegación para paneles
│
├── models/                         # Capa de Datos — operaciones atómicas
│   ├── authModel.ts                # Supabase Auth: signUp, signIn, roles, recovery,
│   │                               #   ban/unban, getUser, getAdminUsers
│   ├── userModel.ts                # Tabla `usuario`: perfil, unicidad DNI/username
│   ├── addressModel.ts             # Tabla `direccion`: crear, actualizar, eliminar
│   └── auditModel.ts              # Tabla `auditoria`: insertar + lectura paginada
│
├── services/                       # Capa de Negocio — orquestadores
│   ├── auth/
│   │   ├── registrationService.ts  # Registro completo con rollback automático
│   │   ├── authService.ts          # Cambio de contraseña, habilitar/deshabilitar usuarios
│   │   └── recoveryService.ts      # Recuperación de contraseña (delega a authModel)
│   ├── admin/
│   │   ├── adminService.ts         # Crear admin, listar y buscar administradores
│   │   └── auditService.ts         # Registrar acciones de auditoría, listar logs
│   └── profile/
│       ├── profileService.ts       # Leer y actualizar perfil del usuario
│       └── completeProfileService.ts # Onboarding admin: perfil + contraseña + metadata
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # createClient() (SSR con cookies) y createAdminClient()
│   │   ├── client.ts               # createBrowserClient() para componentes client-side
│   │   └── proxy.ts                # Middleware: refresco de sesión + RBAC + guard onboarding
│   ├── types/
│   │   ├── auth.ts                 # Enums Genero y Rol, interfaces de Auth
│   │   ├── profile.ts              # Tipos de perfil, payloads, respuestas, paginación
│   │   ├── audit.ts                # AccionAdministrador, AuditLogPayload, AuditoriaRow
│   │   └── supabase.ts             # Tipos auto-generados del esquema de la base de datos
│   ├── validations/
│   │   ├── auth.ts                 # Sanitización, validadores de email, contraseña, username
│   │   ├── profile.ts              # Validación completa del formulario de perfil
│   │   └── db-utils.ts             # escapeLikePattern y formatILIKE (seguridad SQL)
│   ├── services/
│   │   ├── email.ts                # Transporter Nodemailer (Gmail)
│   │   └── googlePlacesService.ts  # Cliente de Google Places Autocomplete API
│   ├── templates/
│   │   └── email-templates.ts      # Template HTML para correo de credenciales de admin
│   ├── utils/
│   │   └── navbar.ts               # getBrandHref() — URL home por rol
│   └── fonts.ts                    # Geist Sans, Geist Mono, Cormorant Garamond
│
├── hooks/
│   ├── useDebounce.ts              # Debounce genérico para inputs de búsqueda
│   ├── useValidation.ts            # Formulario reactivo con validación onChange centralizada
│   └── index.ts                    # Barrel export
│
├── supabase/
│   ├── seed.sql                    # Seed: creación del usuario ROOT en auth.users
│   └── migrations/                 # Migraciones SQL (8 archivos)
│
├── public/                         # Assets estáticos (logos, banner, SVGs)
├── docs/                           # Documentación técnica interna
├── proxy.ts                        # Entry point del middleware Next.js
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Sistema de Roles (RBAC)

| Rol | Enum | Descripción |
|:---|:---|:---|
| **ROOT** | `Rol.ROOT` | SuperAdmin único. Crea y gestiona administradores. No tiene perfil personal. |
| **ADMINISTRADOR** | `Rol.ADMINISTRADOR` | Gestiona catálogo y operaciones. Debe completar su perfil en el primer login. |
| **CLIENTE** | `Rol.CLIENTE` | Usuario final. Registrado vía el formulario público. |
| **VISITANTE** | `"VISITANTE"` (centinela) | No autenticado. Valor de guardia, no se almacena en DB. |

El rol se almacena en `auth.users.raw_app_meta_data.role` y **no puede ser editado por el usuario**. Un trigger de base de datos asigna `CLIENTE` por defecto al registrarse con `signUp`. Solo ROOT puede crear usuarios con otros roles mediante el `adminClient`.

### Protección de Rutas (Middleware)

El middleware en `proxy.ts` aplica cuatro capas de protección en cada request:

1. **Rutas guest-only** (`/login`, `/register`, `/password-recovery`) — redirige a `/` si el usuario ya está autenticado.
2. **Rutas protegidas por rol** — `/panel-root` exige `ROOT`, `/panel-admin` exige `ADMINISTRADOR`.
3. **Guard de onboarding** — un `ADMINISTRADOR` sin `profile_complete: true` en `app_metadata` es forzado a `/completar-perfil`.
4. **Protección de `/perfil`** — requiere sesión activa. ROOT es redirigido a su panel.

> Las peticiones `POST` con el header `next-action` nunca son redirigidas por el middleware, para evitar interrumpir el RSC flight stream de Server Actions.

---

## 🗄️ Base de Datos

### Tablas principales

| Tabla | Propósito |
|:---|:---|
| `usuario` | Perfil del usuario: DNI, nombres, apellidos, fecha/lugar de nacimiento, género, FK dirección |
| `direccion` | Dirección formateada, Google Place ID, detalle opcional |
| `auditoria` | Log de acciones administrativas: acción, descripción, entidad (JSON), actor |
| `libro` | Catálogo de libros: título, ISBN, editorial, precio, idioma, sinopsis, condición |
| `autor` | Autores: nombre, nacionalidad, fecha de nacimiento |
| `categoria` | Categorías literarias |
| `copia` | Ejemplares físicos por tienda: estado (`disponible`, `vendido`, `reservado`) |
| `tienda` | Tiendas físicas: nombre, horario (JSON), FK dirección |
| `compra` | Órdenes de compra: subtotal, total, FK promoción |
| `reserva` | Reservas activas: cantidad, FK libro, FK usuario |
| `tarjeta` | Medios de pago: hash de número, hash CVV, saldo, caducidad |
| `entrega` | Entregas: tipo (`envio`/`recogida`), estado, costos, fechas |
| `devolucion` | Solicitudes de devolución: estado, fecha |
| `noticias` | Vitrina digital: visibilidad, fecha de publicación, FK libro |
| `preferencia_autor` | Preferencias literarias del usuario por autor |
| `preferencia_categoria` | Preferencias literarias del usuario por categoría |
| `hilo_mensajeria` | Hilos de conversación cliente-admin |
| `respuesta` | Respuestas dentro de un hilo |
| `historico` | Trazabilidad de agotamiento de libros |
| `promocion` | Promociones y bonos de descuento |

### Vista

| Vista | Descripción |
|:---|:---|
| `vista_administradores` | Combina `auth.users` con `public.usuario` para exponer `id`, `email`, `nombre_completo`, `rol`, `habilitado` y `created_at` de los administradores. |

### Enums de base de datos

| Enum | Valores |
|:---|:---|
| `accion_administrador` | `crear`, `modificar`, `eliminar` |
| `condicion_libro` | `nuevo`, `usado` |
| `estado_copia` | `disponible`, `vendido`, `reservado` |
| `estado_devolucion` | `revision`, `cancelado`, `devuelto` |
| `estado_entrega` | `en preparacion`, `enviado`, `entregado` |
| `estado_hilo` | `abierto`, `cerrado` |
| `estado_historico` | `agotado`, `disponible` |
| `genero_usuario` | `masculino`, `femenino`, `otro` |
| `motivo_devolucion` | `producto en mal estado`, `no lleno las expectativas`, `el pedido llego a un tiempo superior al estipulado` |
| `tipo_entrega` | `envio`, `recogida` |

### Funciones RPC

| Función | Parámetros | Retorno |
|:---|:---|:---|
| `check_username_exists` | `username_check: string` | `boolean` |
| `current_app_role` | — | `string` |

---

## 🔑 Variables de Entorno

Crear un archivo `.env.local` en `biblioteca-alejandria/` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Gmail SMTP)
GMAIL_USER=
CLAVE_APP_GMAIL=

# Google Places
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# URL base del sitio (utilizada en emails)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno (ver sección anterior)
cp .env.example .env.local

# 3. Ejecutar el seed para crear el usuario ROOT
#    (correr el contenido de supabase/seed.sql en el SQL Editor de Supabase)

# 4. Iniciar el servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 📋 Tipos Compartidos (`lib/types/`)

Todo tipo o interfaz usado en más de una capa se define aquí. **Nunca definir tipos inline en Models o Actions.**

**`lib/types/auth.ts`**

```ts
export enum Genero { Masculino = "masculino", Femenino = "femenino", Otro = "otro" }
export enum Rol { CLIENTE = "CLIENTE", ADMINISTRADOR = "ADMINISTRADOR", ROOT = "ROOT" }

export interface CredentialData { correo: string; contrasena: string; confirmar_contrasena: string }
export interface PersonalData { dni: string; nombres: string; apellidos: string; /* ... */ }
export interface RegisterResponse { success: boolean; errors?: Record<string, string>; message?: string }
export interface AuthActionResult { error?: string; success?: boolean; message?: string }
export interface UserStatusResult { success: boolean; message: string; errorIds?: string[] }
```

**`lib/types/profile.ts`** — `UserProfileData`, `ProfileUpdatePayload`, `ProfileUpdateResponse`, `AdminUserFromView`, `PaginatedAdminUsers`

**`lib/types/audit.ts`** — `AccionAdministrador`, `AuditLogPayload`, `AuditoriaRow`, `AuditoriaResponse`

**`lib/types/supabase.ts`** — Tipos auto-generados por la CLI de Supabase. **No editar manualmente.** Regenerar con:

```bash
supabase gen types typescript --project-id <project-id> > lib/types/supabase.ts
```

---

## 🛡️ Seguridad

- **Roles en `app_metadata`**: No son editables por el usuario (requieren `service_role` key).
- **`createAdminClient()`**: Bypasea RLS. Usado exclusivamente en Server Actions seguros del lado del servidor. Nunca exponer al cliente.
- **Contraseñas**: Gestionadas por Supabase Auth (Argon2 / bcrypt). Nunca manipuladas en texto plano en la aplicación.
- **Validación de contraseña**: Mínimo 8 caracteres, máximo 128, sin espacios en blanco.
- **Sanitización**: Todos los inputs pasan por `sanitizeText()` (trim + colapso de espacios) antes de ser procesados.
- **Escape SQL**: Las búsquedas con `ILIKE` usan `escapeLikePattern()` para prevenir inyección de patrones.
- **Escape HTML en emails**: El template de credenciales escapa `&`, `<`, `>`, `"` y `'` antes de renderizar datos dinámicos.
- **Seguridad en recovery**: El endpoint de recuperación siempre responde de forma idéntica para correos existentes e inexistentes (anti-enumeración). La excepción deliberada: cuentas de administrador deshabilitadas reciben un mensaje informativo para mejorar su UX.