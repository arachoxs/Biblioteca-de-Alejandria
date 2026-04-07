# Integration Tests

Los tests de integración prueban el flujo completo: **Actions → Services → Models → Supabase**.

## Estado Actual

⚠️ **Los tests de integración no están implementados todavía.** Esto se debe a:
- Requieren una instancia de Supabase local corriendo
- Necesitan configuración de Docker y variables de entorno específicas
- Son opcionales para el funcionamiento del proyecto

## Tests Unitarios Disponibles

✅ **471 tests unitarios** están implementados y pasando:
- **68 tests** para models (authModel, userModel, addressModel, auditModel)
- **204 tests** para validations (rules, profile, auth)
- **89 tests** para services (auth, profile, admin)
- **110 tests** para actions (login, register, recovery, profile, admin, audit)

## Cobertura Actual

```
Models:       100% cubiertos
Services:     ~97% cubiertos
Validations:  ~96% cubiertos
Actions:      Tests completos
```

## Implementación Futura de Integration Tests

Cuando se implementen, los tests de integración deberían cubrir estos flujos:

### 1. Registration Flow (`registration.test.ts`)
- Registrar nuevo usuario → verificar en auth.users → verificar perfil en usuario → verificar address
- Registrar con email duplicado → debe fallar
- Registrar con DNI duplicado → debe fallar

### 2. Login Flow (`login.test.ts`)
- Login con credenciales válidas → debe retornar sesión
- Login con contraseña inválida → debe fallar
- Login con email inexistente → debe fallar
- Verificar redirects según rol (ROOT, ADMINISTRADOR, CLIENTE)

### 3. Password Recovery Flow (`password-recovery.test.ts`)
- Enviar código de recuperación a email válido
- Verificar código OTP
- Resetear contraseña con sesión válida

### 4. Profile Update Flow (`profile.test.ts`)
- Obtener perfil existente → debe retornar UserProfileData
- Actualizar perfil con datos nuevos → verificar cambios persistidos
- Actualizar con nueva dirección → verificar inmutabilidad (nueva address creada)

### 5. Admin Management Flow (`admin-management.test.ts`)
- Crear admin (requiere ROOT) → verificar audit log
- Listar admins con paginación
- Buscar admins por término
- Deshabilitar admin → verificar banned_until → verificar audit log
- Habilitar admin → verificar banned_until cleared → verificar audit log

## Configuración Requerida para Integration Tests

```bash
# 1. Instalar y configurar Supabase CLI
npm install -g supabase

# 2. Iniciar Supabase local
supabase start

# 3. Configurar variables de entorno
export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# 4. Ejecutar tests de integración
pnpm test:integration
```

## Estructura de Tests de Integración

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAdminClient, isSupabaseAvailable } from '../helpers';

describe('Integration: Flow Name', () => {
  let supabaseAvailable = false;
  
  beforeAll(async () => {
    supabaseAvailable = await isSupabaseAvailable();
  });
  
  afterAll(async () => {
    if (supabaseAvailable) {
      await cleanupTestData();
    }
  });

  it.skipIf(!supabaseAvailable)('should ...', async () => {
    // Test implementation
  });
});
```

## Por Qué Son Opcionales

Los tests de integración son valiosos pero **no bloqueantes** porque:
1. Los tests unitarios cubren exhaustivamente la lógica de negocio
2. Los mocks simulan todas las interacciones con Supabase
3. Requieren infraestructura adicional (Docker, Supabase local)
4. El desarrollo puede continuar sin ellos

Los tests unitarios proporcionan **suficiente confianza** para el desarrollo diario.
