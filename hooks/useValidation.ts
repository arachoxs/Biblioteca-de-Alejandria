import { useState, useCallback, type Dispatch, type SetStateAction } from "react";

// ─── Tipos ─────────────────────────────────────────────────────────

type ValidationErrors = Record<string, string>;
type ValidationFn<T> = (values: T) => ValidationErrors;
type TouchedState<T> = Partial<Record<keyof T, boolean>>;

interface UseValidationOptions<T> {
  /** Callback opcional llamado cuando un campo cambia (blur o change). */
  onFieldChange?: (field: keyof T) => void;
}

interface UseValidationReturn<T> {
  values: T;
  errors: ValidationErrors;
  touched: TouchedState<T>;
  handleChange: (field: keyof T, value: unknown) => void;
  handleBlur: (field: keyof T) => void;
  setValues: Dispatch<SetStateAction<T>>;
  setErrors: Dispatch<SetStateAction<ValidationErrors>>;
  reset: () => void;
}

/**
 * `useValidation` - Hook para formularios con validación híbrida (touched + blur/change).
 *
 * ## Patrón de validación:
 * 1. **Primera interacción**: Valida solo en `onBlur` (modo paciente).
 * 2. **Corrección de errores**: Si el campo tiene un error actual (`errors[field]`), vuelve a validar en `onChange`.
 * 3. **Validaciones async**: Usar `useDebounce` por separado para verificaciones de unicidad.
 *
 * @template T - Interfaz que define la estructura de los campos del formulario.
 * @param initialValues - Estado inicial de los campos.
 * @param validateFn - Función de validación que retorna errores por campo.
 * @param options - Opciones adicionales como callback onFieldChange.
 *
 * @example
 * const { values, errors, touched, handleChange, handleBlur } = useValidation<Form>(
 *   { email: "", password: "" },
 *   (v) => {
 *     const errs: Record<string, string> = {};
 *     if (!v.email) errs.email = "Requerido";
 *     return errs;
 *   }
 * );
 *
 * <input
 *   value={values.email}
 *   onChange={(e) => handleChange("email", e.target.value)}
 *   onBlur={() => handleBlur("email")}
 * />
 */
export function useValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validateFn: ValidationFn<T>,
  options?: UseValidationOptions<T>
): UseValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedState<T>>({});

  /**
   * Valida solo el campo especificado y actualiza su error.
   */
  const validateField = useCallback(
    (field: keyof T, currentValues: T) => {
      const allErrors = validateFn(currentValues);

      setErrors((prevErrors => {
        const newErrors = { ...prevErrors };

        if (allErrors[field as string]) {
          newErrors[field as string] = allErrors[field as string];
        } else {
          delete newErrors[field as string];
        }

        return newErrors;
      }));
    },
    [validateFn]
  );

  /**
   * Maneja el cambio de valor en un campo.
   * Revalida si el campo tiene un error (independiente de touched).
   * Esto garantiza que errores de submit desaparezcan al corregir.
   */
  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      // Calculamos el nuevo estado de manera síncrona en el closure
      setValues((prevValues) => ({ ...prevValues, [field]: value }));

      // Revalidamos usando las dependencias de valores calculadas dinámicamente
      // Solo revalidamos si ya hay un error
      if (errors[field as string]) {
        // Ejecutamos validateField usando el valor más reciente para el campo modificado
        // Para esto pasamos un objeto temporal que mergea values + campo modificado
        validateField(field, { ...values, [field]: value });
      }

      // Notificamos cambios (limpieza externa)
      options?.onFieldChange?.(field);
    },
    [errors, values, validateField, options]
  );

  /**
   * Maneja el evento blur de un campo.
   * Marca el campo como tocado y ejecuta la validación.
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      // Marcar como tocado
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Validar el campo con los valores actuales
      setValues((currentValues) => {
        validateField(field, currentValues);
        return currentValues;
      });

      // Notificar al formulario que el campo cambió (para limpiar errores externos)
      options?.onFieldChange?.(field);
    },
    [validateField, options]
  );

  /**
   * Reinicia el formulario a su estado inicial.
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    reset,
  };
}