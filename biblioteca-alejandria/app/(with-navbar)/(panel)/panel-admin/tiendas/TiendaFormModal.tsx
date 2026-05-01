"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useValidation } from "@/hooks/useValidation";
import { sanitizeText } from "@/lib/validations/rules";
import {
  validateTienda,
  validateTiendaUpdate,
} from "@/lib/validations/tienda/tiendaData";
import {
  TIENDA_DIAS,
  type CreateTiendaInput,
  type TiendaActionResponse,
  type TiendaDia,
  type UpdateTiendaInput,
} from "@/lib/types/tienda";
import { Loader2, Plus, Save } from "lucide-react";
import { createTiendaAction, updateTiendaAction } from "./action";
import {
  DEFAULT_DAY_RANGE,
  getInitialValues,
  INITIAL_VALUES,
  isSameHorario,
} from "./tienda-form/constants";
import TiendaFormFields from "./tienda-form/TiendaFormFields";
import type {
  TiendaFormModalProps,
  TiendaFormValues,
} from "./tienda-form/types";

export default function TiendaFormModal({
  isOpen,
  onClose,
  onSuccess,
  tienda,
}: TiendaFormModalProps) {
  const isEditing = !!tienda;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<TiendaActionResponse | null>(
    null,
  );
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAddressEdited = useCallback(
    (formValues: TiendaFormValues): boolean => {
      if (!isEditing) return true;

      const normalizedAddress = sanitizeText(formValues.direccion);
      const normalizedPlaceId = formValues.direccion_place_id.trim();
      const originalAddress = sanitizeText(tienda?.direccion_formateada ?? "");
      const originalPlaceId = (tienda?.direccion_place_id ?? "").trim();

      return (
        normalizedAddress !== originalAddress ||
        normalizedPlaceId !== originalPlaceId
      );
    },
    [isEditing, tienda?.direccion_formateada, tienda?.direccion_place_id],
  );

  const validateForm = useCallback(
    (formValues: TiendaFormValues): Record<string, string> => {
      const basePayload = {
        nombre: sanitizeText(formValues.nombre),
        horario: formValues.horario,
      };
      const normalizedAddress = sanitizeText(formValues.direccion);
      const normalizedPlaceId = formValues.direccion_place_id.trim();

      if (isEditing) {
        const updatePayload: UpdateTiendaInput = {
          ...basePayload,
          ...(isAddressEdited(formValues)
            ? {
                direccion: normalizedAddress,
                direccion_place_id: normalizedPlaceId,
              }
            : {}),
        };

        return validateTiendaUpdate(updatePayload);
      }

      const createPayload: CreateTiendaInput = {
        ...basePayload,
        direccion: normalizedAddress,
        direccion_place_id: normalizedPlaceId,
      };

      return validateTienda(createPayload);
    },
    [isAddressEdited, isEditing],
  );

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    reset,
  } = useValidation<TiendaFormValues>(INITIAL_VALUES, validateForm, {
    onFieldChange: () => {
      setAlertState(null);
    },
  });

  const checkIsDirty = useCallback(
    (currentValues: TiendaFormValues): boolean => {
      if (!isEditing || !tienda) return false;

      return (
        sanitizeText(currentValues.nombre) !== sanitizeText(tienda.nombre) ||
        !isSameHorario(currentValues.horario, tienda.horario) ||
        isAddressEdited(currentValues)
      );
    },
    [isAddressEdited, isEditing, tienda],
  );

  const syncHorarioErrors = useCallback(
    (nextValues: TiendaFormValues) => {
      const allErrors = validateForm(nextValues);

      setErrors((prev) => {
        const next = { ...prev };
        delete next.horario;
        for (const dia of TIENDA_DIAS) {
          delete next[`horario_${dia}`];
        }

        if (allErrors.horario) {
          next.horario = allErrors.horario;
        }

        for (const dia of TIENDA_DIAS) {
          const dayError = allErrors[`horario_${dia}`];
          if (dayError) {
            next[`horario_${dia}`] = dayError;
          }
        }

        return next;
      });
    },
    [setErrors, validateForm],
  );

  useEffect(() => {
    if (!isOpen) return;
    setValues(getInitialValues(tienda));
    setErrors({});
    setAlertState(null);
  }, [isOpen, tienda, setErrors, setValues]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    setAlertState(null);
    onClose();
  };

  const handleHorarioEnabled = (day: TiendaDia, enabled: boolean) => {
    setValues((prev) => {
      const nextValues = {
        ...prev,
        horario: {
          ...prev.horario,
          [day]: enabled ? { ...DEFAULT_DAY_RANGE } : null,
        },
      };

      syncHorarioErrors(nextValues);
      return nextValues;
    });
  };

  const handleHorarioTime = (
    day: TiendaDia,
    field: "apertura" | "cierre",
    value: string,
  ) => {
    setValues((prev) => {
      const current = prev.horario[day];
      if (!current) return prev;

      const nextValues = {
        ...prev,
        horario: {
          ...prev.horario,
          [day]: {
            ...current,
            [field]: value,
          },
        },
      };

      syncHorarioErrors(nextValues);
      return nextValues;
    });
  };

  const handleHorarioBlur = () => {
    handleBlur("horario");
    setValues((currentValues) => {
      syncHorarioErrors(currentValues);
      return currentValues;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAlertState(null);

    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    const payloadBase = {
      nombre: sanitizeText(values.nombre),
      horario: values.horario,
    };
    const normalizedAddress = sanitizeText(values.direccion);
    const normalizedPlaceId = values.direccion_place_id.trim();
    const addressEdited = isAddressEdited(values);

    try {
      const response =
        isEditing && tienda
          ? await updateTiendaAction(tienda.id, {
              ...payloadBase,
              ...(addressEdited
                ? {
                    direccion: normalizedAddress,
                    direccion_place_id: normalizedPlaceId,
                  }
                : {}),
            } satisfies UpdateTiendaInput)
          : await createTiendaAction({
              ...payloadBase,
              direccion: normalizedAddress,
              direccion_place_id: normalizedPlaceId,
            } satisfies CreateTiendaInput);

      setAlertState(response);
      if (!response.success) {
        if (response.errors) {
          setErrors(response.errors);
        }
        return;
      }

      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        onClose();
        onSuccess();
      }, 1200);
    } catch {
      setAlertState({
        success: false,
        message: "Ocurrió un error inesperado al guardar la tienda.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDirty = isEditing ? checkIsDirty(values) : false;

  const canSubmit =
    !isSubmitting &&
    values.nombre.trim() !== "" &&
    (isEditing || values.direccion_place_id.trim() !== "") &&
    (!isEditing || isDirty) &&
    Object.keys(errors).length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Editar Tienda" : "Nueva Tienda"}
      maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {alertState?.message && (
          <Alert variant={alertState.success ? "success" : "error"}>
            {alertState.message}
          </Alert>
        )}

        <TiendaFormFields
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
          defaultAddressValue={tienda?.direccion_formateada ?? ""}
          onFieldChange={handleChange}
          onFieldBlur={handleBlur}
          onHorarioEnabledChange={handleHorarioEnabled}
          onHorarioTimeChange={handleHorarioTime}
          onHorarioBlur={handleHorarioBlur}
        />

        {errors.form && (
          <p className="text-sm text-red-500 font-medium">{errors.form}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-auto px-4 py-1 text-sm"
            disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-auto px-6 !py-1 text-sm flex items-center justify-center gap-2">
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
                <span>{isEditing ? "Guardar Cambios" : "Crear Tienda"}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
