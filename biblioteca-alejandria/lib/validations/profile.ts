import type { Genero } from "@/lib/types/auth";

// ─── Tipos ─────────────────────────────────────────────────────────

export interface ProfileFieldsPayload {
  dni?: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero | string;
  usuario: string;
  direccion: string;
  direccion_place_id?: string;
  direccion_detalle?: string | null;
}

// ─── Validación de campos de perfil ────────────────────────────────

/**
 * Valida los campos de datos personales de un perfil.
 * Retorna un objeto de errores (vacío si todo es válido).
 *
 * Reutilizable por: registro de cliente, completar perfil admin,
 * y actualización de perfil.
 */
export function validateProfileFields(
  payload: ProfileFieldsPayload,
  options: { requireDni?: boolean } = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  const { requireDni = false } = options;

  // Campos obligatorios
  const required: { key: keyof ProfileFieldsPayload; label: string }[] = [
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
    { key: "lugar_nacimiento", label: "Lugar de nacimiento" },
    { key: "genero", label: "Género" },
    { key: "usuario", label: "Nombre de usuario" },
    { key: "direccion", label: "Dirección" },
  ];

  if (requireDni) {
    required.unshift({ key: "dni", label: "DNI" });
  }

  for (const { key, label } of required) {
    const value = payload[key];
    if (!value || value.toString().trim() === "") {
      errors[key === "direccion" ? "direccion" : key] =
        `${label} es obligatorio.`;
    }
  }

  // Validar formato del DNI si está presente
  if (!errors.dni && payload.dni) {
    const dniStr = payload.dni.toString().trim();
    const dniRegex = /^[A-Za-z0-9]{5,20}$/;
    if (dniStr.length > 0 && !dniRegex.test(dniStr)) {
      errors.dni = "El documento debe tener entre 5 y 20 caracteres alfanuméricos.";
    }
  }

  // Validar fecha de nacimiento
  if (!errors.fecha_nacimiento) {
    const fechaSeleccionada = new Date(payload.fecha_nacimiento);
    const hoy = new Date();

    if (Number.isNaN(fechaSeleccionada.getTime())) {
      errors.fecha_nacimiento = "La fecha de nacimiento no es válida.";
    } else {
      let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
      const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

      if (
        diferenciaMeses < 0 ||
        (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())
      ) {
        edad--;
      }

      if (fechaSeleccionada > hoy) {
        errors.fecha_nacimiento = "No puedes haber nacido en el futuro.";
      } else if (edad < 18) {
        errors.fecha_nacimiento = "Debes tener al menos 18 años.";
      } else if (edad > 80) {
        errors.fecha_nacimiento = "La edad máxima permitida es 80 años.";
      }
    }
  }

  // Validar dirección con Google Places
  if (!errors.direccion && !payload.direccion_place_id) {
    errors.direccion =
      "Por favor selecciona una dirección válida de las sugerencias.";
  }

  return errors;
}
