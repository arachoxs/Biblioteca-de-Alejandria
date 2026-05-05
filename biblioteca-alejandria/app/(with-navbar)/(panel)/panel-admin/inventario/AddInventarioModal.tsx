"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Loader2, Plus } from "lucide-react";
import type { InventarioOption } from "@/lib/types/inventario";
import type { CopiaActionResponse } from "@/lib/types/copia";
import { useDebounce } from "@/hooks/useDebounce";
import { useValidation } from "@/hooks/useValidation";
import {
  MAX_COPIAS_POR_INSERCION,
} from "@/lib/validations/rules";
import {
  createInventarioAction,
  getInventarioBookOptionsAction,
} from "./action";

interface AddInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface AddInventarioFormValues extends Record<string, unknown> {
  id_libro: string;
  cantidad: string;
}

const INITIAL_VALUES: AddInventarioFormValues = {
  id_libro: "",
  cantidad: "1",
};

function validateAddInventario(
  values: AddInventarioFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const parsedCantidad = Number.parseInt(values.cantidad, 10);

  if (!values.id_libro.trim()) {
    errors.id_libro = "Debes seleccionar un libro.";
  }

  if (!values.cantidad.trim()) {
    errors.cantidad = "La cantidad es obligatoria.";
  } else if (!Number.isInteger(parsedCantidad) || parsedCantidad < 1) {
    errors.cantidad = "La cantidad debe ser un número entero mayor a 0.";
  } else if (parsedCantidad > MAX_COPIAS_POR_INSERCION) {
    errors.cantidad = `La cantidad no puede ser mayor a ${MAX_COPIAS_POR_INSERCION}.`;
  }

  return errors;
}

export default function AddInventarioModal({
  isOpen,
  onClose,
  onSuccess,
}: AddInventarioModalProps) {
  const [bookOptions, setBookOptions] = useState<InventarioOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseState, setResponseState] =
    useState<CopiaActionResponse | null>(null);

  const { values, errors, handleChange, handleBlur, setErrors, reset } =
    useValidation<AddInventarioFormValues>(
      INITIAL_VALUES,
      validateAddInventario,
      {
        onFieldChange: () => {
          setResponseState(null);
        },
      },
    );

  const debouncedBookSearchTerm = useDebounce(bookSearchTerm, 300);

  const resetForm = () => {
    reset();
    setBookSearchTerm("");
    setResponseState(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const loadBookOptions = useCallback(async (searchTerm: string) => {
    setIsLoadingBooks(true);

    try {
      const response = await getInventarioBookOptionsAction(searchTerm);
      if (response.success && response.data) {
        setBookOptions(response.data);
        return;
      }
      setBookOptions([]);
    } catch (error) {
      console.error("Error cargando opciones de libros:", error);
      setBookOptions([]);
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadBookOptions(debouncedBookSearchTerm);
  }, [isOpen, debouncedBookSearchTerm, loadBookOptions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResponseState(null);

    const validationErrors = validateAddInventario(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const parsedCantidad = Number.parseInt(values.cantidad, 10);

    try {
      const response = await createInventarioAction({
        id_libro: values.id_libro,
        cantidad: parsedCantidad,
      });

      setResponseState(response);

      if (response.success) {
        onSuccess(response.message ?? "Inventario agregado exitosamente.");
        handleClose();
        return;
      }

      if (response.errors) {
        setErrors((prev) => ({ ...prev, ...response.errors }));
      }
    } catch {
      setResponseState({
        success: false,
        message: "Ocurrió un error inesperado al crear inventario.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar nuevo inventario"
      maxWidth="2xl"
      allowOverflow>
      <form onSubmit={handleSubmit} className="space-y-5">
        {responseState?.message && (
          <Alert variant={responseState.success ? "success" : "error"}>
            {responseState.message}
          </Alert>
        )}

        <SearchableSelect
          id="inventario-libro"
          label="Libro"
          value={values.id_libro}
          options={bookOptions}
          onChange={(value) => handleChange("id_libro", value)}
          onBlur={() => {
            handleBlur("id_libro");
            //reiniciar valor para forzar nueva búsqueda al abrir el select nuevamente
            setBookSearchTerm("");
          }}
          onSearchChange={setBookSearchTerm}
          required
          disabled={isSubmitting}
          error={errors.id_libro}
          placeholder="Selecciona un libro"
          noOptionsText={
            isLoadingBooks ? "Buscando libros..." : "No se encontraron libros."
          }
        />

        <Input
          id="inventario-cantidad"
          label="Cantidad de copias"
          type="number"
          min={1}
          max={MAX_COPIAS_POR_INSERCION}
          step={1}
          required
          disabled={isSubmitting}
          value={values.cantidad}
          onChange={(event) => handleChange("cantidad", event.target.value)}
          onBlur={() => handleBlur("cantidad")}
          error={errors.cantidad}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="w-auto! px-4 py-1 text-sm border-brand-secondary/30! text-brand-text! hover:bg-brand-secondary/10! hover:text-brand-primary!"
            onClick={handleClose}
            disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              Object.keys(errors).length > 0 ||
              values.id_libro === ""
            }
            className="w-auto! px-6 py-1! text-sm inline-flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Agregar inventario
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
