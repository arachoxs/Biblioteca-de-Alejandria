"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import type {
  CategoryActionResponse,
  CategoryCreateInput,
} from "@/lib/types/category";
import { useValidation } from "@/hooks/useValidation";
import { validateCategory } from "@/lib/validations/category";
import { sanitizeText } from "@/lib/validations/rules";
import { Loader2, Plus } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  loadingLabel: string;
  initialValues: CategoryCreateInput;
  onClose: () => void;
  onSubmit: (values: CategoryCreateInput) => Promise<CategoryActionResponse>;
  onSuccess: (id?: number | string) => Promise<void> | void;
}

interface CategoryFormValues extends Record<string, unknown> {
  nombre: string;
  descripcion: string;
}

export default function CategoryFormModal({
  isOpen,
  title,
  submitLabel,
  loadingLabel,
  initialValues,
  onClose,
  onSubmit,
  onSuccess,
}: CategoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<CategoryActionResponse | null>(
    null,
  );

  const validateForm = (values: CategoryFormValues): Record<string, string> =>
    validateCategory({
      nombre: sanitizeText(values.nombre),
    });

  const { values, errors, handleChange, handleBlur, setValues, setErrors } =
    useValidation<CategoryFormValues>(
      {
        nombre: initialValues.nombre,
        descripcion: initialValues.descripcion ?? "",
      },
      validateForm,
      {
        onFieldChange: () => {
          setAlertState(null);
        },
      },
    );

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      nombre: initialValues.nombre,
      descripcion: initialValues.descripcion ?? "",
    });
    setErrors({});
    setAlertState(null);
  }, [
    initialValues.descripcion,
    initialValues.nombre,
    isOpen,
    setErrors,
    setValues,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setAlertState(null);

    try {
      const sanitizedDescription = sanitizeText(values.descripcion);
      const payload: CategoryCreateInput = {
        nombre: sanitizeText(values.nombre),
        descripcion: sanitizedDescription === "" ? null : sanitizedDescription,
      };

      const validationErrors = validateCategory({
        nombre: payload.nombre,
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const response = await onSubmit(payload);

      setAlertState(response);

      if (response.success) {
        await onSuccess(response.id);
        onClose();
        return;
      }

      setErrors(response.errors ?? {});
    } catch {
      setAlertState({
        success: false,
        message: "Ocurrió un error inesperado al procesar la categoría.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreateMode = submitLabel.toLowerCase().includes("crear");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {alertState?.message && (
          <Alert
            variant={alertState.success ? "success" : "error"}
            className="!relative !left-0 !translate-x-0">
            {alertState.message}
          </Alert>
        )}

        <Input
          id="category-name"
          label="Nombre"
          placeholder="Ej. Novela histórica"
          value={values.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          onBlur={() => handleBlur("nombre")}
          error={errors.nombre}
          required
          disabled={isSubmitting}
        />

        <Input
          id="category-description"
          label="Descripción"
          placeholder="Describe brevemente la categoría"
          value={values.descripcion}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          onBlur={() => handleBlur("descripcion")}
          error={errors.descripcion}
          disabled={isSubmitting}
        />

        {errors.form && (
          <p className="text-sm text-red-500 font-medium">{errors.form}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-auto px-4 py-1 text-sm">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              Object.keys(errors).length > 0 ||
              !values.nombre.trim()
            }
            className="w-auto px-6 !py-1 text-sm flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <>
                {isCreateMode && <Plus className="w-4 h-4" />}
                <span>{submitLabel}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
