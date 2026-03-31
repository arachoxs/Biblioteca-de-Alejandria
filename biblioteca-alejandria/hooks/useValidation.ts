import { useState } from "react";

/**
 * Tipos para la gestión de errores y la función de validación.
 */
type ValidationErrors = Record<string, string>;
type ValidationFn<T> = (values: T) => ValidationErrors;

/**
 * `useValidation` - Custom Hook para la gestión de formularios con validación reactiva.
 * * Este hook permite controlar el estado de múltiples inputs de forma centralizada y 
 * ejecutar una lógica de validación personalizada en cada cambio de tecla (onChange).
 * * @template T - Interfaz que define la estructura de los campos del formulario.
 * * @param {T} initialValues - Objeto con el estado inicial de los campos (ej: { email: "", pass: "" }).
 * @param {ValidationFn<T>} validateFn - Función que recibe los valores actuales y retorna un objeto de errores.
 * * @returns {Object} Un objeto con:
 * - `values`: El estado actual del formulario.
 * - `errors`: Objeto con mensajes de error por campo (si los hay).
 * - `handleChange`: Función para actualizar campos: `(field: keyof T, value: unknown) => void`.
 * - `setValues`: Función nativa de React para actualizaciones manuales o externas.
 * * @example
 * interface Form { usuario: string }
 * * const { values, errors, handleChange } = useValidation<Form>(
 * { usuario: "" },
 * (v) => v.usuario.length < 3 ? { usuario: "Muy corto" } : {}
 * );
 * * // Uso en JSX:
 * // <input value={values.usuario} onChange={(e) => handleChange("usuario", e.target.value)} />
 */

export function useValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validateFn: ValidationFn<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Maneja el cambio de valor en un campo específico.
   * * @param field - La llave del objeto que se desea actualizar (debe existir en T).
   * @param value - El nuevo valor para dicho campo.
   */
  const handleChange = (field: keyof T, value: unknown) => {
    // 1. Calculamos los nuevos valores temporalmente
    const newValues = { ...values, [field]: value };
    
    // 2. Actualizamos el estado de los valores
    setValues(newValues);

    console.log("Valores actualizados:", newValues); // Debug: Ver los nuevos valores
    
    // 3. Validamos usando los nuevos valores inmediatos y actualizamos los errores
    setErrors(validateFn(newValues));
  };

  return { values, errors, handleChange, setValues };
}