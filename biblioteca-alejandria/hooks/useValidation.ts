import { useState, useCallback, type Dispatch, type SetStateAction } from "react";

// ─── Tipos ─────────────────────────────────────────────────────────

type ValidationErrors = Record<string, string>;
type ValidationFn<T> = (values: T) => ValidationErrors;
type TouchedState<T> = Partial<Record<keyof T, boolean>>;

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
  validateFn: ValidationFn<T>
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
      setErrors(allErrors);
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
      setValues((prevValues) => {
        const newValues = { ...prevValues, [field]: value };

        // Revalidar si hay error presente (sin importar touched)
        if (errors[field as string]) {
          validateField(field, newValues);
        }

        return newValues;
      });
    },
    [errors, validateField]
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
    },
    [validateField]
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