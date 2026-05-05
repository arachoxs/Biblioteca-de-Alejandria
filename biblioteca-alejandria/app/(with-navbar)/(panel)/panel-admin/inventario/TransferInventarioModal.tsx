"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import type {
  InventarioOption,
  InventarioTransferBookOption,
} from "@/lib/types/inventario";
import type { CopiaActionResponse } from "@/lib/types/copia";
import {
  getInventarioDefaultStoreAction,
  getInventarioTransferBooksByStoreAction,
  transferInventarioByQuantityAction,
} from "./action";
import { useValidation } from "@/hooks/useValidation";
import { on } from "events";

interface TransferInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  storeOptions: InventarioOption[];
}

interface TransferInventarioFormValues extends Record<string, unknown> {
  id_tienda_origen: string;
  id_tienda_destino: string;
  id_libro: string;
  cantidad: string;
}

const INITIAL_VALUES: TransferInventarioFormValues = {
  id_tienda_origen: "",
  id_tienda_destino: "",
  id_libro: "",
  cantidad: "1",
};

function validateTransferInventarioFields(
  values: TransferInventarioFormValues,
  maxAvailableCopies: number,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.id_tienda_origen.trim()) {
    errors.id_tienda_origen = "Debes seleccionar una tienda origen.";
  }

  if (!values.id_tienda_destino.trim()) {
    errors.id_tienda_destino = "Debes seleccionar una tienda destino.";
  } else if (values.id_tienda_destino === values.id_tienda_origen) {
    errors.id_tienda_destino =
      "La tienda destino debe ser diferente a la tienda origen.";
  }

  if (!values.id_libro.trim()) {
    errors.id_libro = "Debes seleccionar un libro.";
  }

  const parsedCantidad = Number.parseInt(values.cantidad, 10);

  if (!values.cantidad.trim()) {
    errors.cantidad = "La cantidad es obligatoria.";
  } else if (!Number.isInteger(parsedCantidad) || parsedCantidad < 1) {
    errors.cantidad = "La cantidad debe ser mayor a 0.";
  } else if (maxAvailableCopies === 0) {
    errors.cantidad = "No hay copias disponibles para trasladar.";
  } else if (parsedCantidad > maxAvailableCopies) {
    errors.cantidad = `La cantidad no puede superar ${maxAvailableCopies}.`;
  }

  return errors;
}

export default function TransferInventarioModal({
  isOpen,
  onClose,
  onSuccess,
  storeOptions,
}: TransferInventarioModalProps) {
  const [bookOptions, setBookOptions] = useState<
    InventarioTransferBookOption[]
  >([]);
  const [isLoadingDefaultStore, setIsLoadingDefaultStore] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseState, setResponseState] =
    useState<CopiaActionResponse | null>(null);

  const validateForm = useCallback(
    (vals: TransferInventarioFormValues) => {
      const availableCopies =
        bookOptions.find((book) => book.value === vals.id_libro)
          ?.max_copias_disponibles ?? 0;
      return validateTransferInventarioFields(vals, availableCopies);
    },
    [bookOptions],
  );

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setErrors,
    setValues,
    reset,
  } = useValidation<TransferInventarioFormValues>(
    INITIAL_VALUES,
    validateForm,
    {
      onFieldChange: () => setResponseState(null),
    },
  );

  const selectedBook = useMemo(
    () => bookOptions.find((book) => book.value === values.id_libro) ?? null,
    [bookOptions, values.id_libro],
  );

  const maxAvailableCopies = selectedBook?.max_copias_disponibles ?? 0;

  const loadBooksByStore = useCallback(async (storeId: string) => {
    setIsLoadingBooks(true);
    try {
      const response = await getInventarioTransferBooksByStoreAction(storeId);
      if (response.success && response.data) {
        setBookOptions(response.data);
        return;
      }

      setBookOptions([]);
      if (response.message) {
        setResponseState({
          success: false,
          message: response.message,
        });
      }
    } catch {
      setBookOptions([]);
      setResponseState({
        success: false,
        message: "Ocurrió un error inesperado al cargar libros disponibles.",
      });
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  const handleClose = () => {
    reset();
    setBookOptions([]);
    setResponseState(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const setupDefaultStore = async () => {
      setIsLoadingDefaultStore(true);
      setResponseState(null);
      setErrors({});
      setBookOptions([]);

      try {
        const response = await getInventarioDefaultStoreAction();
        const fallbackOrigin =
          response.success && response.data
            ? response.data.value
            : (storeOptions[0]?.value ?? "");
        const fallbackDestination =
          storeOptions.find((store) => store.value !== fallbackOrigin)?.value ??
          "";

        setValues({
          id_tienda_origen: fallbackOrigin,
          id_tienda_destino: fallbackDestination,
          id_libro: "",
          cantidad: "1",
        });

        if (!response.success && response.message) {
          setResponseState({
            success: false,
            message: response.message,
          });
        }
      } catch {
        const fallbackOrigin = storeOptions[0]?.value ?? "";
        const fallbackDestination =
          storeOptions.find((store) => store.value !== fallbackOrigin)?.value ??
          "";

        setValues({
          id_tienda_origen: fallbackOrigin,
          id_tienda_destino: fallbackDestination,
          id_libro: "",
          cantidad: "1",
        });
        setResponseState({
          success: false,
          message: "No se pudo resolver la tienda principal de inventario.",
        });
      } finally {
        setIsLoadingDefaultStore(false);
      }
    };

    void setupDefaultStore();
  }, [isOpen, storeOptions, setErrors, setValues]);

  useEffect(() => {
    if (!isOpen || !values.id_tienda_origen) return;
    void loadBooksByStore(values.id_tienda_origen);
  }, [isOpen, values.id_tienda_origen, loadBooksByStore]);

  useEffect(() => {
    if (!values.id_libro) return;
    const bookStillExists = bookOptions.some(
      (book) => book.value === values.id_libro,
    );
    if (bookStillExists) return;
    setValues((prev) => ({ ...prev, id_libro: "", cantidad: "1" }));
  }, [bookOptions, values.id_libro, setValues]);

  const destinationOptions = useMemo(
    () =>
      storeOptions.filter((store) => store.value !== values.id_tienda_origen),
    [storeOptions, values.id_tienda_origen],
  );

  const handleOriginStoreChange = (storeId: string) => {
    const availableDestinations = storeOptions.filter(
      (store) => store.value !== storeId,
    );
    const fallbackDestination =
      availableDestinations.find((store) => store.value !== storeId)?.value ??
      availableDestinations[0]?.value ??
      "";

    handleChange("id_tienda_origen", storeId);
    handleChange(
      "id_tienda_destino",
      values.id_tienda_destino && values.id_tienda_destino !== storeId
        ? values.id_tienda_destino
        : fallbackDestination,
    );
    handleChange("id_libro", "");
    handleChange("cantidad", "1");
    setErrors({});
    setResponseState(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResponseState(null);

    const validationErrors = validateTransferInventarioFields(
      values,
      maxAvailableCopies,
    );

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await transferInventarioByQuantityAction({
        id_tienda_origen: values.id_tienda_origen,
        id_tienda_destino: values.id_tienda_destino,
        id_libro: values.id_libro,
        cantidad: Number.parseInt(values.cantidad, 10),
      });

      setResponseState(response);

      if (response.success) {
        onSuccess(response.message ?? "Inventario trasladado exitosamente.");
        handleClose();
        return;
      }

      if (response.errors) {
        setErrors((prev) => ({ ...prev, ...response.errors }));
      }
    } catch {
      setResponseState({
        success: false,
        message: "Ocurrió un error inesperado al trasladar inventario.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Trasladar inventario por cantidad"
      maxWidth="2xl"
      allowOverflow>
      <form onSubmit={handleSubmit} className="space-y-5">
        {responseState?.message && (
          <Alert variant={responseState.success ? "success" : "error"}>
            {responseState.message}
          </Alert>
        )}

        <SearchableSelect
          id="transfer-origin-store"
          label="Tienda origen"
          value={values.id_tienda_origen}
          options={storeOptions}
          onChange={handleOriginStoreChange}
          onBlur={() => handleBlur("id_tienda_origen")}
          required
          disabled={isSubmitting || isLoadingDefaultStore}
          error={errors.id_tienda_origen}
          placeholder="Selecciona la tienda origen"
          noOptionsText="No hay tiendas disponibles."
        />

        <SearchableSelect
          id="transfer-destination-store-quantity"
          label="Tienda destino"
          value={values.id_tienda_destino}
          options={destinationOptions}
          onChange={(value) => handleChange("id_tienda_destino", value)}
          onBlur={() => handleBlur("id_tienda_destino")}
          required
          disabled={isSubmitting || isLoadingDefaultStore}
          error={errors.id_tienda_destino}
          placeholder="Selecciona la tienda destino"
          noOptionsText="No hay otra tienda disponible."
        />

        <SearchableSelect
          id="transfer-book-by-quantity"
          label="Libro disponible en tienda origen"
          value={values.id_libro}
          options={bookOptions}
          onChange={(value) => {
            handleChange("id_libro", value);
            handleChange("cantidad", "1");
          }}
          onBlur={() => handleBlur("id_libro")}
          required
          disabled={isSubmitting || isLoadingBooks || isLoadingDefaultStore}
          error={errors.id_libro}
          placeholder="Selecciona un libro"
          noOptionsText={
            isLoadingBooks
              ? "Cargando libros de la tienda..."
              : "No hay libros con copias disponibles en esta tienda."
          }
        />

        <div className="rounded-lg border border-brand-accent/20 bg-brand-bg px-4 py-3">
          <p className="text-sm font-semibold text-brand-primary">
            Máximo de copias disponibles para traslado: {maxAvailableCopies}
          </p>
        </div>

        <Input
          id="transfer-quantity"
          label="Cantidad de copias a trasladar"
          type="number"
          min={1}
          max={maxAvailableCopies || undefined}
          step={1}
          required
          disabled={
            isSubmitting ||
            isLoadingBooks ||
            !values.id_libro ||
            maxAvailableCopies === 0
          }
          value={values.cantidad}
          onChange={(event) => handleChange("cantidad", event.target.value)}
          onBlur={() => {
            handleBlur("cantidad");
            if (maxAvailableCopies === 0) return;
            const parsedCantidad = Number.parseInt(values.cantidad, 10);
            if (
              values.cantidad &&
              (Number.isNaN(parsedCantidad) || parsedCantidad < 1)
            ) {
              setErrors((prev) => ({
                ...prev,
                cantidad: "La cantidad debe ser mayor a 0.",
              }));
            } else if (parsedCantidad > maxAvailableCopies) {
              setErrors((prev) => ({
                ...prev,
                cantidad: `La cantidad no puede superar ${maxAvailableCopies}.`,
              }));
            }
          }}
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
              isLoadingDefaultStore ||
              isLoadingBooks ||
              !values.id_tienda_origen ||
              !values.id_tienda_destino ||
              !values.id_libro
            }
            className="w-auto! px-6 py-1! text-sm inline-flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Trasladando...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Trasladar inventario
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
