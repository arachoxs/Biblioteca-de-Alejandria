"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PersonalDataFields from "@/components/PersonalDataFields";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ClientModules from "@/components/profile/ClientModules";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import { updateProfileAction } from "./actions";
import { useValidation } from "@/hooks/useValidation";
import type { UserProfileData } from "@/lib/types/profile";
import type { Genero } from "@/lib/types/auth";
import {
    validateFieldRules,
    requiredRule,
    maxLengthRule,
    usernameRule,
    placeIdRequiredRule,
    generoRule,
    MAX_NOMBRE,
    MAX_APELLIDO,
    MAX_DIRECCION_DETALLE,
} from "@/lib/validations/rules";

interface PerfilClientProps {
    profileData: UserProfileData;
    isCliente: boolean;
}

export type EditPerfilFormValues = {
    nombres: string;
    apellidos: string;
    genero: Genero | "";
    direccion_detalle: string;
    usuario: string;
};

export default function PerfilClient({ profileData, isCliente }: PerfilClientProps) {
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [changePwdOpen, setChangePwdOpen] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState(profileData.direccion_formateada);
    const [placeId, setPlaceId] = useState(profileData.direccion_place_id);
    const [resetKey, setResetKey] = useState(0);
    const [isDirty, setIsDirty] = useState(false);
    const router = useRouter();

    const initialValues: EditPerfilFormValues = {
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        genero: profileData.genero,
        direccion_detalle: profileData.direccion_detalle ?? "",
        usuario: profileData.usuario,
    };

    const validateForm = useCallback((values: EditPerfilFormValues): Record<string, string> => {
        const errors: Record<string, string> = {};

        const nombresError = validateFieldRules(values.nombres, [
            requiredRule("Nombres"),
            maxLengthRule(MAX_NOMBRE, "Nombres"),
        ]);
        if (nombresError) errors.nombres = nombresError;

        const apellidosError = validateFieldRules(values.apellidos, [
            requiredRule("Apellidos"),
            maxLengthRule(MAX_APELLIDO, "Apellidos"),
        ]);
        if (apellidosError) errors.apellidos = apellidosError;

        const generoError = validateFieldRules(values.genero, [requiredRule("Género"), generoRule()]);
        if (generoError) errors.genero = generoError;

        const usuarioError = validateFieldRules(values.usuario, [requiredRule("Nombre de usuario"), usernameRule()]);
        if (usuarioError) errors.usuario = usuarioError;

        const direccionDetalleError = validateFieldRules(values.direccion_detalle, [
            maxLengthRule(MAX_DIRECCION_DETALLE, "Detalle de la dirección"),
        ]);
        if (direccionDetalleError) errors.direccion_detalle = direccionDetalleError;

        return errors;
    }, []);

    const { values, errors, handleChange, handleBlur, setErrors, setValues } = useValidation<EditPerfilFormValues>(
        initialValues,
        validateForm,
        {
            onFieldChange: (field) => {
                setServerErrors((prev) => {
                    const next = { ...prev };
                    delete next[field as string];
                    return next;
                });
            }
        }
    );

    const allErrors = { ...errors, ...serverErrors };

    const checkIsDirty = useCallback((currentValues: EditPerfilFormValues) => {
        return (
            currentValues.nombres !== profileData.nombres ||
            currentValues.apellidos !== profileData.apellidos ||
            currentValues.genero !== profileData.genero ||
            currentValues.usuario !== profileData.usuario ||
            (currentValues.direccion_detalle || "") !== (profileData.direccion_detalle || "") ||
            formattedAddress !== profileData.direccion_formateada ||
            placeId !== profileData.direccion_place_id
        );
    }, [profileData, formattedAddress, placeId]);

    useEffect(() => {
        setIsDirty(checkIsDirty(values));
    }, [values, checkIsDirty]);

    useEffect(() => {
        const direccionError = validateFieldRules(formattedAddress, [requiredRule("Dirección")]);
        const placeIdError = !direccionError ? validateFieldRules(placeId, [placeIdRequiredRule()]) : null;
        const nextDireccionError = direccionError || placeIdError;

        setErrors((prev) => {
            if (nextDireccionError) {
                if (prev.direccion === nextDireccionError) return prev;
                return { ...prev, direccion: nextDireccionError };
            }

            if (!prev.direccion) return prev;
            const next = { ...prev };
            delete next.direccion;
            return next;
        });

        setServerErrors((prev) => {
            if (!prev.direccion) return prev;
            const next = { ...prev };
            delete next.direccion;
            return next;
        });
    }, [formattedAddress, placeId, setErrors]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationErrors = validateForm(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);
        setServerErrors({});
        setSuccess(false);

        try {
            const response = await updateProfileAction(
                values, //se manda los valores ya que son los que tienen la información actualizada, el payload se construye en la acción a partir de esos valores y de los otros datos como la dirección
                formattedAddress,
                placeId
            );

            if (response.success) {
                setSuccess(true);
                setServerErrors({});
                setIsDirty(false);
                router.refresh();
            } else {
                setServerErrors(response.errors || { form: response.message || "Error desconocido" });
            }
        } catch (err: unknown) {
            console.error(err);
            setServerErrors({ form: "Ocurrió un error inesperado." });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setServerErrors({});
        setErrors({});
        setSuccess(false);
        setFormattedAddress(profileData.direccion_formateada);
        setPlaceId(profileData.direccion_place_id);
        setValues(initialValues);
        setResetKey(prev => prev + 1);
        setIsDirty(false);
        router.refresh();
    };

    return (
        <div className="animate-[fadeUp_0.6s_ease-out_both]">
            {/* ── Header ── */}
            <header className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 border-[3px] border-brand-accent rounded-full bg-brand-bg shadow-lg shadow-brand-accent/10 mb-4">
                    <svg className="w-10 h-10 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight mb-2 font-display">
                    Mi Perfil
                </h1>
                <div className="w-12 h-0.5 bg-brand-accent mx-auto rounded-full mb-3" />
                <p className="text-sm text-brand-secondary font-light max-w-lg mx-auto leading-relaxed">
                    Actualiza tu información personal y mantén tus datos al día para una mejor experiencia en la plataforma.
                </p>
            </header>

            {/* ── Form Card ── */}
            <div className="bg-white rounded-lg border border-brand-accent/25 shadow-[0_1px_3px_rgba(10,9,8,0.04),0_8px_30px_rgba(10,9,8,0.06)] p-6 md:p-8 mb-6">
                <form key={resetKey} onSubmit={handleSubmit} className="space-y-8">

                    {/* Mensajes de estado globales */}
                    {allErrors.form && (
                        <Alert variant="error">
                            {allErrors.form}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success">
                            Perfil actualizado correctamente.
                        </Alert>
                    )}

                    {/* Datos personales — componente reutilizable */}
                    <PersonalDataFields
                        errors={allErrors}
                        disabledFields={["dni", "fecha_nacimiento", "lugar_nacimiento"]}
                        defaultValues={{
                            ...profileData,
                            direccion_detalle: profileData.direccion_detalle ?? undefined,
                        }}
                        values={{
                            dni: profileData.dni,
                            nombres: values.nombres,
                            apellidos: values.apellidos,
                            fecha_nacimiento: profileData.fecha_nacimiento,
                            lugar_nacimiento: profileData.lugar_nacimiento,
                            genero: values.genero as Genero,
                            direccion_detalle: values.direccion_detalle,
                        }}
                        onChange={(field, value) => handleChange(field as keyof EditPerfilFormValues, value)}
                        onBlur={(field) => handleBlur(field as keyof EditPerfilFormValues)}
                        onPlaceSelect={(selectedPlaceId) => setPlaceId(selectedPlaceId)}
                        onFormattedAddressSelect={(addressText) => setFormattedAddress(addressText)}
                    />

                    {/* Datos de acceso */}
                    <fieldset className="space-y-5">
                        <legend className="text-base md:text-lg font-bold text-brand-primary uppercase tracking-widest pb-2 border-b border-brand-secondary/30 w-full">
                            Datos de acceso
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                id="usuario"
                                name="usuario"
                                label="Nombre de usuario"
                                placeholder="juangarcia"
                                required
                                value={values.usuario}
                                onChange={(e) => handleChange("usuario", e.target.value)}
                                onBlur={() => handleBlur("usuario")}
                                error={allErrors.usuario}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Input
                                    id="correo"
                                    name="correo"
                                    label="Correo electrónico"
                                    type="email"
                                    disabled
                                    required
                                    defaultValue={profileData.correo}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Botones de acción */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 mt-8 border-t border-brand-accent/20">
                        <button
                            type="button"
                            onClick={() => setChangePwdOpen(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-5 rounded-lg border border-brand-accent/30 text-brand-secondary text-sm font-medium hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-sm transition-all cursor-pointer group"
                        >
                            <svg className="w-4 h-4 mr-2 text-brand-accent group-hover:text-brand-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Cambiar contraseña
                        </button>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-lg text-brand-secondary text-sm font-medium uppercase tracking-wider hover:bg-brand-secondary/10 hover:text-brand-primary transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            )}
                            <Button
                                type="submit"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-8"
                                disabled={loading || !isDirty || Object.keys(errors).length > 0}
                                title={!isDirty ? "No hay cambios para guardar" : undefined}
                            >
                                {loading ? (
                                    <>
                                        <svg className="text-brand-bg size-4 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Módulos adicionales (solo CLIENTE) ── */}
            {isCliente && <ClientModules />}

            {/* ── Modal de Cambiar Contraseña ── */}
            <ChangePasswordModal
                isOpen={changePwdOpen}
                onClose={() => setChangePwdOpen(false)}
            />
        </div>
    );
}