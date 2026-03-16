# 📚 Documentación Técnica: Lógica de Registro e Integridad

Este documento detalla el funcionamiento interno de las funciones de registro de usuarios y las reglas de arquitectura que deben seguir los desarrolladores.

---

## 1. Función: `registerAuthUser`

Esta función es la encargada de gestionar la creación de identidades en el servicio de autenticación de Supabase.

## 3. Guía de Uso para Desarrolladores

### Cómo llamar a la función desde un Server Action
Los desarrolladores **no deben** manejar la lógica de base de datos en el Action. Solo deben invocar al modelo:

```typescript
// Ejemplo de implementación correcta
export async function actionRegistro(formData: FormData) {
  // 1. Limpiar y validar datos del formulario...
  
  // 2. Invocar al modelo
  const result = await registerUser(credentialData, personalData, RolEnum.CLIENTE);

  // 3. Responder a la interfaz
  if (result.success) {
    redirect("/dashboard");
  }
  
  return result; // Contiene los errores para mostrar en los inputs
}
```

### Descripción
Registra las credenciales en la tabla de autenticación (`auth.users`) y asigna metadatos críticos como el rol y el nombre de usuario.

### Lógica de Seguridad (Jerarquía)
La función implementa una barrera de seguridad basada en el rol del ejecutor:
- Si el rol a registrar es **distinto** a `CLIENTE`, la función verifica que quien ejecuta la acción sea un usuario con rol `ROOT`.
- Si un usuario anónimo o un usuario sin permisos intenta crear un rol administrativo, la función retorna un error de permisos.

### Estructura de Retorno
Devuelve un tipo `InternalAuthResponse`, el cual es una intersección que incluye la respuesta estándar de éxito/error más los datos técnicos de Supabase (`AuthResponse['data']`).

### Casos de uso
- Dentro de registerUser
- Creacion de administradores sin informacion personal
---

## 2. Función: `registerUser`

Es la función **Orquestadora** y el punto de entrada principal para los procesos de registro desde los Server Actions.

### Flujo de Ejecución (Orden Crítico)
Para optimizar recursos y garantizar la seguridad, la función sigue este orden estrictamente:

1.  **Validación de DNI:** Se consulta la tabla `usuario` para asegurar que el DNI no esté duplicado.
2.  **Validación de Username:** Se ejecuta el RPC `check_username_exists` para validar disponibilidad.
3.  **Llamada a `registerAuthUser`:** Se intenta crear la cuenta en el servicio de Auth.
4.  **Persistencia de Dirección:** Se inserta la ubicación y se obtiene el `id` generado.
5.  **Persistencia de Perfil:** Se realiza un `upsert` en la tabla `usuario` vinculando el `userId` de Auth con el `id_direccion`.

### Gestión de Rollbacks (Atomicidad)
Si la base de datos falla después de haber creado el usuario en Auth, la función ejecuta una limpieza manual:
- **Fallo en Dirección:** Se elimina el usuario de Auth.
- **Fallo en Perfil:** Se elimina el usuario de Auth **y** se elimina la dirección previamente insertada.
