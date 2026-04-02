# Refactor de Validación — Fuente Única + Hook Híbrido

**Fecha:** 2026-04-02  
**Estado:** Implementado

## Contexto

Las reglas de validación estaban **dispersas y duplicadas** en 3 lugares del codebase:

1. **`RegistroForm.tsx` (líneas 51-117)** — Regex hardcodeados inline (DNI, email, contraseña, edad)
2. **`lib/validations/auth.ts`** — Validadores imperativos (`validateEmail()`, `validatePasswordRule()`, etc.)
3. **`lib/validations/profile.ts`** — `validateAndSanitizeProfile()` que combinaba validación + sanitización

Además, el hook `useValidation` tenía problemas de rendimiento:
- Validaba en **cada tecla** (innecesario para primera interacción)
- Contenía `console.log` de debug
- No diferenciaba campos "tocados" vs. nuevos

Esta dispersión causaba dificultades para:
- **Mantenibilidad**: cambios en reglas requieren buscar en múltiples archivos
- **Consistencia**: validaciones cliente/servidor podían diverger
- **Reutilización**: reglas atómicas no eran reutilizables en composición

## Decisiones

### 1. Fuente única de reglas: `lib/validations/rules.ts`

Se renombró `auth.ts` → `rules.ts` (nombre más semántico) y se agregó:

- **Tipo base**: `ValidationRule = (value: unknown) => string | null`
- **Helper reutilizable**: `validateFieldRules(value, rules[])` que ejecuta lista de reglas en orden
- **Reglas atómicas**: `requiredRule()`, `emailRule()`, `passwordRule()`, `dniRule()`, `usernameRule()`, `ageRule()`, `matchRule()`, `minLengthRule()`, `maxLengthRule()`, `notBlankRule()`

Los validadores legacy (`validateEmail()`, `validatePasswordRule()`, etc.) ahora son **wrappers que usan las reglas atómicas internamente**, garantizando **cero duplicación** y compatibilidad hacia atrás.

### 2. Patrón Híbrido en el Hook (Touched + Blur/Change)

El hook `useValidation` ahora expone:
- `touched: Partial<Record<keyof T, boolean>>` — marca qué campos fueron interactuados
- `handleBlur(field)` — marca como touched + valida
- `handleChange(field, value)` — revalida si el campo tiene error presente (sin importar `touched`)

**Estrategia**:
1. **Primera interacción** → Validar en `onBlur` (modo paciente: dejar que el usuario termine)
2. **Corrección de errores** → Validar en `onChange` si hay error visible (modo reactivo: mostrar mejora inmediata)
3. **Validaciones async** (unicidad de usuario/email) → Usar `useDebounce` existente (300-500ms)

Este patrón mejora UX evitando mensajes de error intrusivos mientras el usuario aún está escribiendo.

**Iteración posterior (fix Select fields):**  
La condición inicial era `touched[field] && errors[field]`, pero causaba un bug: errores de submit en campos Select no se limpiaban al seleccionar un valor (el campo no estaba en `touched`). Se cambió a solo `errors[field]` para que cualquier error visible se limpie inmediatamente al corregir.

### 3. Compatibilidad hacia atrás

- API del hook es **aditiva**: `handleChange` sigue funcionando igual para consumidores no migrados
- `PerfilClient.tsx` y `CompletarPerfilAdmin.tsx` se dejan sin cambios (fuera de alcance)
- Validadores legacy mantienen su firma original

### 4. Apoyo a PersonalDataFields

Se agregó prop `onBlur?: (field: keyof PersonalDataValues) => void` al componente `PersonalDataFields` para permitir que formularios que lo usen puedan adoptar el patrón híbrido sin cambios de arquitectura.

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `lib/validations/auth.ts` | Renombrado a `rules.ts` |
| `lib/validations/rules.ts` | + `ValidationRule`, `validateFieldRules()`, 9 reglas atómicas, wrappers legacy |
| `lib/validations/profile.ts` | Import actualizado (`./auth` → `./rules`) |
| `hooks/useValidation.ts` | Nueva API: `touched`, `handleBlur`, `setErrors`, `reset`, patrón híbrido |
| `components/PersonalDataFields.tsx` | + prop `onBlur` en interface, propagado a todos los inputs |
| `app/(auth)/register/RegistroForm.tsx` | Eliminada validación inline (~66 líneas), ahora usa reglas de `rules.ts` |
| `app/actions/authActions.ts` | Import: `auth` → `rules` |
| `app/(auth)/register/actions.ts` | Import: `auth` → `rules` |
| `app/completar-perfil/actions.ts` | Import: `auth` → `rules` |
| `app/(panel)/panel-root/administradores/action.ts` | Import: `auth` → `rules` |
| `app/(auth)/password-recovery/actions.ts` | Import: `auth` → `rules` |
| `app/(auth)/login/actions.ts` | Import: `auth` → `rules` |
| `docs/cambio-contrasena.md` | Referencia de archivo actualizada |

## Archivos NO Tocados

- `app/perfil/PerfilClient.tsx` — No usa `useValidation` (validación solo server)
- `app/completar-perfil/CompletarPerfilAdmin.tsx` — No usa `useValidation` (validación solo server)

## Beneficios

1. **Una sola fuente de verdad** — Todas las reglas definidas en `lib/validations/rules.ts`
2. **Cero duplicación** — Regex y lógica de validación no se repiten
3. **Mejor UX** — Patrón híbrido evita mensajes de error prematuros
4. **Rendimiento** — Hook no valida innecesariamente en cada tecla
5. **Mantenibilidad** — Cambios de reglas requieren tocar un único lugar
6. **Composabilidad** — `validateFieldRules(value, [rule1(), rule2()])` permite combinar reglas
7. **Compatibilidad** — API hacia atrás compatible, wrappers legacy mantienen firmas

## Validación

- ✓ Build exitoso (`pnpm run build`)
- ✓ TypeScript sin errores
- ✓ Comportamiento idéntico (no regresiones observadas)
- ✓ Eliminadas ~66 líneas de código duplicado en `RegistroForm.tsx`
- ✓ Testing manual: DNI/username con espacios detectan error en blur
- ✓ Testing manual: Dirección valida `placeId` cuando hay texto
- ✓ Testing manual: HTML5 validation desactivada (`noValidate`)
- ✓ Testing manual: Select fields limpian errores al seleccionar opción
- ✓ Testing manual: Contraseña con solo espacios muestra "no puede contener espacios" en lugar de "es obligatorio"

## Próximos Pasos (Sugerencias)

1. **Adopción en otros formularios**: Migrar `PerfilClient` y `CompletarPerfilAdmin` al patrón híbrido cuando sea conveniente
2. **Validaciones async**: Implementar verificación de unicidad (usuario/email) usando `useDebounce` + API backend
3. **Deprecation**: Marcar como deprecated los validadores legacy en favor de reglas atómicas en futuras refactorizaciones
