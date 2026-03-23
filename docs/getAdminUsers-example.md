# Ejemplo de uso de getAdminUsers

## Descripción
La función `getAdminUsers` permite obtener todos los usuarios con rol `ADMINISTRADOR` de manera paginada, incluyendo sus nombres y apellidos desde la tabla `usuario`.

## Uso en el backend (Server Action o API Route)

```typescript
import { getAdminUsers } from "@/models/userModel";
import type { AdminUsersResponse } from "@/lib/types/profile";

// En una Server Action
export async function fetchAdminUsers(page: number = 1, pageSize: number = 10): Promise<AdminUsersResponse> {
  try {
    const result = await getAdminUsers(page, pageSize);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error al obtener administradores:", error);
    return {
      success: false,
      errors: { form: "Error al obtener la lista de administradores" },
      message: "No se pudo obtener la lista de administradores"
    };
  }
}
```

## Uso en el frontend (Componente Next.js)

```typescript
"use client";

import { useState, useEffect } from "react";
import type { PaginatedAdminUsers, AdminUser } from "@/models/userModel";

export default function AdminUsersTable() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    async function loadAdmins() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`);
        const result: PaginatedAdminUsers = await response.json();
        
        setAdminUsers(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Error al cargar administradores:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAdmins();
  }, [page]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h2>Lista de Administradores</h2>
      
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Fecha de Creación</th>
          </tr>
        </thead>
        <tbody>
          {adminUsers.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.email}</td>
              <td>{admin.nombres}</td>
              <td>{admin.apellidos}</td>
              <td>{new Date(admin.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Anterior
        </button>
        
        <span>Página {page} de {totalPages}</span>
        
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

## Ejemplo de API Route (app/api/admin/users/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAdminUsers } from "@/models/userModel";
import type { AdminUsersResponse } from "@/lib/types/profile";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  try {
    const result = await getAdminUsers(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API route:", error);
    return NextResponse.json(
      {
        success: false,
        errors: { form: "Error al obtener administradores" },
        message: "No se pudo obtener la lista de administradores"
      } satisfies AdminUsersResponse,
      { status: 500 }
    );
  }
}
```

## Estructura de la respuesta

```typescript
{
  data: [
    {
      id: "uuid-del-usuario",
      email: "admin@ejemplo.com",
      nombres: "Juan",
      apellidos: "Pérez",
      created_at: "2024-01-15T10:30:00.000Z"
    },
    // ... más usuarios
  ],
  total: 25,          // Total de administradores
  page: 1,            // Página actual
  pageSize: 10,       // Resultados por página
  totalPages: 3       // Total de páginas
}
```

## Notas importantes

- La función requiere el cliente de administración de Supabase (`createAdminClient`)
- Solo debe llamarse desde el backend (Server Actions o API Routes)
- La paginación se maneja eficientemente para evitar cargar todos los usuarios en memoria
- Los usuarios sin perfil completo en la tabla `usuario` son filtrados automáticamente
