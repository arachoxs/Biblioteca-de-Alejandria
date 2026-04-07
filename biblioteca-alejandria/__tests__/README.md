# Testing con Supabase Local

Este proyecto usa Vitest para pruebas unitarias e integración.

## Configuración

### Pruebas Unitarias

Las pruebas unitarias usan mocks y no requieren Supabase local:

```bash
pnpm test:unit
```

### Pruebas de Integración

Las pruebas de integración requieren una instancia local de Supabase.

#### Prerrequisitos

1. **Docker instalado y corriendo**
2. **Supabase CLI** (ya está en devDependencies)

#### Iniciar Supabase Local

```bash
# Iniciar todos los servicios de Supabase
pnpm supabase start

# Esto mostrará las URLs y keys locales:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJ...
# Service role key: eyJ...
```

#### Configurar Variables de Entorno para Tests

Crea un archivo `.env.test.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

#### Ejecutar Pruebas de Integración

```bash
# Asegúrate de que Supabase está corriendo
pnpm supabase status

# Ejecutar pruebas de integración
pnpm test:integration
```

#### Detener Supabase Local

```bash
pnpm supabase stop
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm test` | Ejecuta todas las pruebas una vez |
| `pnpm test:watch` | Ejecuta pruebas en modo watch |
| `pnpm test:coverage` | Ejecuta pruebas con reporte de cobertura |
| `pnpm test:unit` | Solo pruebas unitarias |
| `pnpm test:integration` | Solo pruebas de integración |
| `pnpm test:models` | Solo tests de models |
| `pnpm test:services` | Solo tests de services |
| `pnpm test:validations` | Solo tests de validations |

## Estructura de Tests

```
__tests__/
├── setup.ts                    # Setup global
├── mocks/
│   ├── supabase.ts            # Mocks de Supabase
│   ├── auth.ts                # Factories de User/Session
│   └── fixtures.ts            # Datos de prueba
├── unit/
│   ├── models/                # Tests unitarios de models
│   ├── services/              # Tests unitarios de services
│   └── validations/           # Tests de validaciones
└── integration/
    ├── flows/                 # Flujos completos
    └── helpers/               # Utilidades para integración
```

## Cobertura

El reporte de cobertura se genera en `./coverage/` al ejecutar:

```bash
pnpm test:coverage
```

Abre `coverage/index.html` en el navegador para ver el reporte interactivo.
