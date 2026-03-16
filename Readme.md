# 📚 Biblioteca de Alejandría - E-commerce

Este es un proyecto de E-commerce de libros moderno, desarrollado con un enfoque en rendimiento, escalabilidad y seguridad.

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Gestor de paquetes:** [pnpm](https://pnpm.io/)

---

## 🎨 Guía de Estilos (Design System)

Para garantizar la consistencia visual de la "Biblioteca de Alejandría", hemos definido una paleta de colores personalizada. **No utilizar códigos hexadecimales en los componentes**, usar las clases de Tailwind configuradas:

| Categoría | Clase Tailwind | Hex | Uso Sugerido |
| :--- | :--- | :--- | :--- |
| **Primary** | `brand-primary` | `#49111C` | Botones de acción, títulos destacados. |
| **Secondary** | `brand-secondary` | `#5E503F` | Navegación, elementos secundarios. |
| **Accent** | `brand-accent` | `#A9927D` | Detalles, hovers, bordes decorativos. |
| **Background**| `brand-bg` | `#F2F4F3` | Color de fondo principal de la aplicación. |
| **Text** | `brand-text` | `#0A0908` | Color de fuente para párrafos y lectura. |

*Ejemplo de uso:* `<button className="bg-brand-primary text-brand-bg">Registrarse</button>`

---

## 🏗️ Arquitectura y Estructura de Carpetas

El proyecto sigue una estructura basada en la separación de responsabilidades, adaptando el patrón **MVC** al ecosistema de Next.js:

```text
/app
 ├── (auth)/        # Route Group: Registro, Login (URL limpia)
 ├── (shop)/        # Route Group: Catálogo, Carrito, Detalles de libros
 ├── actions/       # CONTROLADORES: Lógica de servidor (Server Actions)
 ├── components/    # VISTAS: Componentes de UI (Atomos, Moléculas)
 ├── lib/           # MODELO/CONFIG: Cliente Supabase, utilidades técnicas
 └── globals.css    # Estilos globales y configuración de Tailwind

 ---

## Arquitectura del proyecto (MVC)

Este proyecto sigue un patrón MVC adaptado a Next.js. Cada capa tiene una responsabilidad clara:

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| **Model** | `models/userModel.ts` | Acceso a la base de datos (Supabase), inserciones y rollbacks. Sin lógica de UI. |
| **View** | `app/.../NombreForm.tsx` | Componente React (`"use client"`). Maneja estado visual y llama al Controller. |
| **Controller** | `app/.../actions.ts` | Server Action (`"use server"`). Valida los datos y orquesta la llamada al Model. |

### Flujo de datos
```
View (Form)  →  Controller (actions.ts)  →  Model (userModel.ts)
                       ↑                          ↓
                  Validaciones            Supabase / BD
                       ↓
               RegisterResponse  →  View (setErrors / setSuccess)
```

### Tipos compartidos — `lib/types/`

Todo tipo o interfaz usado en más de una capa debe definirse en `lib/types/`, **nunca** inline en el Model o Controller.
```ts
// ✅ Correcto — lib/types/auth.ts
export interface RegisterResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}
```

Los tipos actuales del dominio de autenticación están en `lib/types/auth.ts`: `CredentialData`, `PersonalData`, `RegisterResponse`, `Genero` y `Rol`.