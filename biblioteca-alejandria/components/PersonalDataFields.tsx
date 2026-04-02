"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import { Country } from "country-state-city";
import type { Genero } from "@/lib/types/auth";

// ─── Opciones estáticas ────────────────────────────────────────────

const generoOptions = [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" },
];

const paisOptions = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: country.name,
}));

// ─── Tipos ─────────────────────────────────────────────────────────

export interface PersonalDataValues {
    dni?: string;
    nombres?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    lugar_nacimiento?: string;
    genero?: Genero;
    direccion_formateada?: string;
    direccion_place_id?: string;
    direccion_detalle?: string;
    usuario?: string;
}

interface PersonalDataFieldsProps {
    errors: Record<string, string>;
    disabledFields?: string[];
    defaultValues?: PersonalDataValues;
    values?: PersonalDataValues;  // Valores controlados
    //cuando se usa validaciones instantenas la fuentes de la verdad lo dan los values y no los defaultValues, por eso se pasan ambos, para poder usar el componente en ambos contextos (con o sin validaciones instantaneas)
    onChange?: <K extends keyof PersonalDataValues>(field: K, value: PersonalDataValues[K]) => void;  // Handler para onChange
    onBlur?: (field: keyof PersonalDataValues) => void;  // Handler para onBlur (patrón híbrido de validación)
    onPlaceSelect: (placeId: string) => void;
    onFormattedAddressSelect: (address: string) => void;
}

// ─── Componente ────────────────────────────────────────────────────

/**
 * Grilla de campos de datos personales reutilizable.
 * Se compone **dentro** de un `<form>` padre — no es un form por sí mismo.
 */
export default function PersonalDataFields({
    errors,
    disabledFields = [],
    defaultValues = {},
    values, //se pasan nuevos datos para las validaciones instanteas
    onChange,
    onBlur,
    onPlaceSelect,
    onFormattedAddressSelect,
}: PersonalDataFieldsProps) {
    const isDisabled = (field: string) => disabledFields.includes(field);
    const isControlled = values !== undefined && onChange !== undefined;

    return (
        <fieldset className="space-y-5">
            <legend className="text-base md:text-lg font-bold text-brand-primary uppercase tracking-widest pb-2 border-b border-brand-secondary/30 w-full">
                Datos personales
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    id="dni"
                    name="dni"
                    label="DNI"
                    placeholder="1234567890"
                    required
                    disabled={isDisabled("dni")}
                    {...(isControlled
                        ? { value: values.dni || "", onChange: (e) => onChange!("dni", e.target.value) }
                        : { defaultValue: defaultValues.dni }
                    )}
                    onBlur={onBlur ? () => onBlur("dni") : undefined}
                    error={errors.dni}
                />
                <Input
                    id="nombres"
                    name="nombres"
                    label="Nombres"
                    placeholder="Juan Carlos"
                    required
                    {...(isControlled
                        ? { value: values.nombres || "", onChange: (e) => onChange!("nombres", e.target.value) }
                        : { defaultValue: defaultValues.nombres }
                    )}
                    onBlur={onBlur ? () => onBlur("nombres") : undefined}
                    error={errors.nombres}
                />
                <Input
                    id="apellidos"
                    name="apellidos"
                    label="Apellidos"
                    placeholder="García López"
                    required
                    {...(isControlled
                        ? { value: values.apellidos || "", onChange: (e) => onChange!("apellidos", e.target.value) }
                        : { defaultValue: defaultValues.apellidos }
                    )}
                    onBlur={onBlur ? () => onBlur("apellidos") : undefined}
                    error={errors.apellidos}
                />
                <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    label="Fecha de nacimiento"
                    type="date"
                    required
                    disabled={isDisabled("fecha_nacimiento")}
                    {...(isControlled
                        ? { value: values.fecha_nacimiento || "", onChange: (e) => onChange!("fecha_nacimiento", e.target.value) }
                        : { defaultValue: defaultValues.fecha_nacimiento }
                    )}
                    onBlur={onBlur ? () => onBlur("fecha_nacimiento") : undefined}
                    error={errors.fecha_nacimiento}
                />

                <Select
                    id="lugar_nacimiento"
                    name="lugar_nacimiento"
                    label="Lugar de nacimiento"
                    options={paisOptions}
                    required
                    disabled={isDisabled("lugar_nacimiento")}
                    {...(isControlled
                        ? { value: values.lugar_nacimiento || "", onChange: (e) => onChange!("lugar_nacimiento", e.target.value) }
                        : { defaultValue: defaultValues.lugar_nacimiento }
                    )}
                    onBlur={onBlur ? () => onBlur("lugar_nacimiento") : undefined}
                    error={errors.lugar_nacimiento}
                />
                <Select
                    id="genero"
                    name="genero"
                    label="Género"
                    options={generoOptions}
                    required
                    {...(isControlled
                        ? { value: values.genero || "", onChange: (e) => onChange!("genero", e.target.value as Genero) }
                        : { defaultValue: defaultValues.genero }
                    )}
                    onBlur={onBlur ? () => onBlur("genero") : undefined}
                    error={errors.genero}
                />

                <GoogleAutocomplete
                    id="direccion_autocomplete"
                    name="direccion_autocomplete"
                    label="Dirección de correspondencia"
                    placeholder="Cra 12 #34-56, Bogotá"
                    required
                    defaultValue={defaultValues.direccion_formateada}
                    onPlaceSelect={onPlaceSelect}
                    onFormattedAddressSelect={onFormattedAddressSelect}
                    error={errors.direccion}
                />

                <Input
                    id="direccion_detalle"
                    name="direccion_detalle"
                    label="Detalle de la dirección"
                    placeholder="Apto 101, Piso 2"
                    {...(isControlled
                        ? { value: values.direccion_detalle || "", onChange: (e) => onChange!("direccion_detalle", e.target.value) }
                        : { defaultValue: defaultValues.direccion_detalle }
                    )}
                    onBlur={onBlur ? () => onBlur("direccion_detalle") : undefined}
                    error={errors.direccion_detalle}
                />

            </div>
        </fieldset>
    );
}
