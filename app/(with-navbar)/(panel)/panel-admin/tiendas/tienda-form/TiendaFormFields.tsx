import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import Input from "@/components/ui/Input";
import { TIENDA_DIA_LABELS, TIENDA_DIAS, type TiendaDia } from "@/lib/types/tienda";
import type { TiendaFormErrors, TiendaFormValues } from "./types";

interface TiendaFormFieldsProps {
  values: TiendaFormValues;
  errors: TiendaFormErrors;
  isSubmitting: boolean;
  isEditing: boolean;
  defaultAddressValue: string;
  onFieldChange: (field: keyof TiendaFormValues, value: unknown) => void;
  onFieldBlur: (field: keyof TiendaFormValues) => void;
  onHorarioEnabledChange: (day: TiendaDia, enabled: boolean) => void;
  onHorarioTimeChange: (
    day: TiendaDia,
    field: "apertura" | "cierre",
    value: string,
  ) => void;
  onHorarioBlur: () => void;
}

export default function TiendaFormFields({
  values,
  errors,
  isSubmitting,
  isEditing,
  defaultAddressValue,
  onFieldChange,
  onFieldBlur,
  onHorarioEnabledChange,
  onHorarioTimeChange,
  onHorarioBlur,
}: TiendaFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="tienda-nombre"
          label="Nombre de la tienda"
          type="text"
          placeholder="Ej: Alejandría Centro"
          value={values.nombre}
          onChange={(event) => onFieldChange("nombre", event.target.value)}
          onBlur={() => onFieldBlur("nombre")}
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
          defaultValue={isEditing ? defaultAddressValue : values.direccion}
          onFormattedAddressSelect={(address) => onFieldChange("direccion", address)}
          onPlaceSelect={(placeId) => onFieldChange("direccion_place_id", placeId)}
          onBlur={() => onFieldBlur("direccion")}
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
                      onChange={(event) =>
                        onHorarioEnabledChange(day, event.target.checked)
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
                      onChange={(event) =>
                        onHorarioTimeChange(day, "apertura", event.target.value)
                      }
                      onInput={(event) =>
                        onHorarioTimeChange(
                          day,
                          "apertura",
                          (event.target as HTMLInputElement).value,
                        )
                      }
                      onBlur={onHorarioBlur}
                      disabled={isSubmitting}
                    />
                    <Input
                      id={`tienda-${day}-cierre`}
                      label="Cierre"
                      type="time"
                      value={range.cierre}
                      onChange={(event) =>
                        onHorarioTimeChange(day, "cierre", event.target.value)
                      }
                      onInput={(event) =>
                        onHorarioTimeChange(
                          day,
                          "cierre",
                          (event.target as HTMLInputElement).value,
                        )
                      }
                      onBlur={onHorarioBlur}
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
    </>
  );
}
