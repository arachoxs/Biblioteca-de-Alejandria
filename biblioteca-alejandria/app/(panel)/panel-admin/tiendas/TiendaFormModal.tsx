"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { Loader2, Plus, Save } from "lucide-react";
import { useValidation } from "@/hooks/useValidation";
import { validateTienda, validateTiendaUpdate } from "@/lib/validations/tienda";
import {
  TIENDA_DIA_LABELS,
  TIENDA_DIAS,
  type CreateTiendaInput,
  type TiendaActionResponse,
  type TiendaDia,
  type TiendaHorario,
  type UpdateTiendaInput,
  type TiendaWithDireccion,
} from "@/lib/types/tienda";
import { createTiendaAction, updateTiendaAction } from "./action";
import { sanitizeText } from "@/lib/validations/rules";

interface TiendaFormValues extends Record<string, unknown> {
  nombre: string;
  direccion: string;
  direccion_place_id: string;
  horario: TiendaHorario;
}

interface TiendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tienda?: TiendaWithDireccion | null;
}

const DEFAULT_DAY_RANGE = { apertura: "09:00", cierre: "18:00" };

const INITIAL_HORARIO: TiendaHorario = {
  lunes: { ...DEFAULT_DAY_RANGE },
  martes: { ...DEFAULT_DAY_RANGE },
  miercoles: { ...DEFAULT_DAY_RANGE },
  jueves: { ...DEFAULT_DAY_RANGE },
  viernes: { ...DEFAULT_DAY_RANGE },
  sabado: null,
  domingo: null,
};

const INITIAL_VALUES: TiendaFormValues = {
  nombre: "",
  direccion: "",
  direccion_place_id: "",
  horario: cloneHorario(INITIAL_HORARIO),
};

function cloneHorario(horario: TiendaHorario): TiendaHorario {
  return {
    lunes: horario.lunes ? { ...horario.lunes } : null,
    martes: horario.martes ? { ...horario.martes } : null,
    miercoles: horario.miercoles ? { ...horario.miercoles } : null,
    jueves: horario.jueves ? { ...horario.jueves } : null,
    viernes: horario.viernes ? { ...horario.viernes } : null,
    sabado: horario.sabado ? { ...horario.sabado } : null,
    domingo: horario.domingo ? { ...horario.domingo } : null,
  };
}

function getInitialValues(
  tienda?: TiendaWithDireccion | null,
): TiendaFormValues {
  if (!tienda) {
    return {
      nombre: INITIAL_VALUES.nombre,
      direccion: INITIAL_VALUES.direccion,
      direccion_place_id: INITIAL_VALUES.direccion_place_id,
      horario: cloneHorario(INITIAL_VALUES.horario),
    };
  }

  return {
    nombre: tienda.nombre,
    direccion: tienda.direccion_formateada,
    direccion_place_id: "",
    horario: cloneHorario(tienda.horario),
  };
}

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

      return normalizedAddress !== originalAddress || normalizedPlaceId !== "";
    },
    [isEditing, tienda?.direccion_formateada],
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

  const canSubmit =
    !isSubmitting &&
    values.nombre.trim() !== "" &&
    (isEditing || values.direccion_place_id.trim() !== "") &&
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="tienda-nombre"
            label="Nombre de la tienda"
            type="text"
            placeholder="Ej: Alejandría Centro"
            value={values.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            onBlur={() => handleBlur("nombre")}
            error={errors.nombre}
            required
            disabled={isSubmitting}
          />

          <GoogleAutocomplete
            id="tienda-direccion-autocomplete"
            name="tienda-direccion-autocomplete"
            label="Dirección"
            placeholder="Ingresa y selecciona la dirección"
            required
            defaultValue={values.direccion}
            onFormattedAddressSelect={(address) =>
              handleChange("direccion", address)
            }
            onPlaceSelect={(placeId) =>
              handleChange("direccion_place_id", placeId)
            }
            onBlur={() => handleBlur("direccion")}
            error={errors.direccion}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-primary tracking-wide">
              Horario semanal
            </h3>
            <p className="text-xs text-brand-secondary/80">
              Marca los días de atención y define su rango horario.
            </p>
          </div>

          {errors.horario && (
            <p className="text-xs text-red-500 font-medium">{errors.horario}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIENDA_DIAS.map((day) => {
              const range = values.horario[day];
              const isOpenDay = range !== null;
              const dayHorarioError = errors[`horario_${day}`];

              return (
                <div
                  key={day}
                  className={`border border-brand-accent/20 rounded-lg bg-white p-3 space-y-3 ${dayHorarioError ? "border-red-500" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-text">
                      {TIENDA_DIA_LABELS[day]}
                    </span>
                    <label className="inline-flex items-center gap-2 text-xs text-brand-secondary">
                      <input
                        type="checkbox"
                        checked={isOpenDay}
                        onChange={(e) =>
                          handleHorarioEnabled(day, e.target.checked)
                        }
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded border-brand-secondary/40 accent-brand-primary cursor-pointer"
                      />
                      Abre
                    </label>
                  </div>

                  {isOpenDay ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id={`tienda-${day}-apertura`}
                        label="Apertura"
                        type="time"
                        value={range.apertura}
                        onChange={(e) =>
                          handleHorarioTime(day, "apertura", e.target.value)
                        }
                        onInput={(e) =>
                          handleHorarioTime(
                            day,
                            "apertura",
                            (e.target as HTMLInputElement).value,
                          )
                        }
                        onBlur={handleHorarioBlur}
                        disabled={isSubmitting}
                      />
                      <Input
                        id={`tienda-${day}-cierre`}
                        label="Cierre"
                        type="time"
                        value={range.cierre}
                        onChange={(e) =>
                          handleHorarioTime(day, "cierre", e.target.value)
                        }
                        onInput={(e) =>
                          handleHorarioTime(
                            day,
                            "cierre",
                            (e.target as HTMLInputElement).value,
                          )
                        }
                        onBlur={handleHorarioBlur}
                        disabled={isSubmitting}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-brand-secondary/70">
                      Sin atención este día.
                    </p>
                  )}

                  {dayHorarioError && (
                    <p className="text-xs text-red-500">{dayHorarioError}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
            className="w-auto px-5 py-1 text-sm flex items-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditing ? "Guardando..." : "Creando..."}
              </>
            ) : (
              <>
                {isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditing ? "Guardar Cambios" : "Crear Tienda"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
