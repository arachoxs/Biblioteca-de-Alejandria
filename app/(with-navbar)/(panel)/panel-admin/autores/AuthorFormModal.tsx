"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import { Country } from "country-state-city";
import { Plus, Save, Loader2 } from "lucide-react";
import { crearAutor, actualizarAutor } from "./action";
import { useValidation } from "@/hooks/useValidation";
import { validateAuthor } from "@/lib/validations/author";
import type { AuthorFormValues, AuthorWithBookCount } from "@/lib/types/author";
import type { AuthorActionResponse } from "@/lib/types/author";

// ─── Validación del formulario ─────────────────────────────────────

const INITIAL_VALUES: AuthorFormValues = {
  nombre: "",
  nacionalidad: "",
  fecha_nacimiento: "",
};

const paisOptions = Country.getAllCountries().map((country) => ({
  value: country.name,
  label: country.name,
}));



// ─── Props ─────────────────────────────────────────────────────────

interface AuthorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id?: number | string) => void;
  /** Si se pasa un autor, el modal entra en modo edición. */
  author?: AuthorWithBookCount | null;
}

// ─── Componente ────────────────────────────────────────────────────

export default function AuthorFormModal({
  isOpen,
  onClose,
  onSuccess,
  author,
}: AuthorFormModalProps) {
  const isEditing = !!author;

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    reset,
  } = useValidation<AuthorFormValues>(INITIAL_VALUES, validateAuthor);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<AuthorActionResponse | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Precargar valores al editar
  useEffect(() => {
    if (isOpen && author) {
      setValues({
        nombre: author.nombre || "",
        nacionalidad: author.nacionalidad || "",
        fecha_nacimiento: author.fecha_nacimiento || "",
      });
    } else if (isOpen && !author) {
      reset();
    }
  }, [isOpen, author]);

  // Cleanup del timer
  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    reset();
    setAlertState(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const validationErrors = validateAuthor(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setAlertState(null);

    try {
      let response: AuthorActionResponse;

      if (isEditing && author) {
        response = await actualizarAutor(
          author.id,
          values.nombre,
          values.nacionalidad,
          values.fecha_nacimiento
        );
      } else {
        response = await crearAutor(
          values.nombre,
          values.nacionalidad,
          values.fecha_nacimiento
        );
      }

      if (response.success) {
        setAlertState(response);

        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null;
          handleClose();
          onSuccess(response.id);
        }, 1500);
      } else {
        setAlertState(response);
      }
    } catch {
      setAlertState({
        success: false,
        message: "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CanSubmit: el nombre no está vacío y no hay errores de validación
  const canSubmit =
    values.nombre.trim() !== "" &&
    Object.keys(errors).length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Editar Autor" : "Nuevo Autor"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {alertState && (
          <Alert variant={alertState.success ? "success" : "error"}>
            {alertState.message}
          </Alert>
        )}

        <Input
          id="author-nombre"
          label="Nombre completo"
          type="text"
          placeholder="Ej: Gabriel García Márquez"
          value={values.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          onBlur={() => handleBlur("nombre")}
          error={errors.nombre}
          required
          disabled={isSubmitting}
        />

        <Select
          id="author-nacionalidad"
          label="Nacionalidad"
          options={paisOptions}
          value={values.nacionalidad}
          onChange={(e) => handleChange("nacionalidad", e.target.value)}
          onBlur={() => handleBlur("nacionalidad")}
          error={errors.nacionalidad}
          disabled={isSubmitting}
        />

        <Input
          id="author-fecha-nacimiento"
          label="Fecha de nacimiento"
          type="date"
          value={values.fecha_nacimiento}
          onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
          onBlur={() => handleBlur("fecha_nacimiento")}
          error={errors.fecha_nacimiento}
          disabled={isSubmitting}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-auto px-4 py-1 text-sm !border-brand-secondary/30 !text-brand-text hover:!bg-brand-secondary/10 hover:!text-brand-primary transition-all"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="w-auto px-6 !py-1 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEditing ? "Guardando..." : "Creando..."}</span>
              </>
            ) : (
              <>
                {isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditing ? "Guardar Cambios" : "Crear Autor"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
