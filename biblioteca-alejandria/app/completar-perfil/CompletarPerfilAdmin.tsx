"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PersonalDataFields from "@/components/PersonalDataFields";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { completarPerfilAction } from "./actions";
import { useValidation } from "@/hooks/useValidation";
import {
    validateFieldRules,
    requiredRule,
    dniRule,
    notBlankRule,
    ageRule,
    usernameRule,
    matchRule,
} from "@/lib/validations/rules";
import { validatePasswords, isPasswordValid } from "@/lib/validations/auth";
import type { Genero } from "@/lib/types/auth";

// ─── Tipos ─────────────────────────────────────────────────────────

type CompletarPerfilFormValues = {
    dni: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: Genero | "";
    direccion_detalle: string;
    usuario: string;
    nueva_contrasena: string;
    confirmar_contrasena: string;
};

// ─── Componente ────────────────────────────────────────────────────

export default function CompletarPerfilAdmin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState("");
    const [placeId, setPlaceId] = useState("");

    // Función de validación usando reglas atómicas de rules.ts
    const validateForm = useCallback((values: CompletarPerfilFormValues): Record<string, string> => {
        const errors: Record<string, string> = {};

        // Validar dirección (requerida)
        if (!formattedAddress) {
            errors.direccion = "La dirección es obligatoria.";
        }

        // Validar DNI
        const dniError = validateFieldRules(values.dni, [requiredRule("DNI"), dniRule()]);
        if (dniError) errors.dni = dniError;

        // Validar nombres/apellidos
        const nombresError = validateFieldRules(values.nombres, [requiredRule("Nombres"), notBlankRule("nombres")]);
        if (nombresError) errors.nombres = nombresError;

        const apellidosError = validateFieldRules(values.apellidos, [requiredRule("Apellidos"), notBlankRule("apellidos")]);
        if (apellidosError) errors.apellidos = apellidosError;

        // Validar fecha de nacimiento (18-80 años)
        const fechaError = validateFieldRules(values.fecha_nacimiento, [requiredRule("Fecha de nacimiento"), ageRule(18, 80)]);
        if (fechaError) errors.fecha_nacimiento = fechaError;

        // Validar lugar de nacimiento
        const lugarError = validateFieldRules(values.lugar_nacimiento, [requiredRule("Lugar de nacimiento")]);
        if (lugarError) errors.lugar_nacimiento = lugarError;

        // Validar género
        const generoError = validateFieldRules(values.genero, [requiredRule("Género")]);
        if (generoError) errors.genero = generoError;

        // Validar usuario
        const usuarioError = validateFieldRules(values.usuario, [requiredRule("Nombre de usuario"), usernameRule()]);
        if (usuarioError) errors.usuario = usuarioError;

        // Validar contraseñas (nueva_contrasena y confirmar_contrasena) - usar indicador visual
        const passwordErrors = validatePasswords(values.nueva_contrasena, values.confirmar_contrasena, true);
        if (passwordErrors?.confirmar_contrasena) {
            errors.confirmar_contrasena = passwordErrors.confirmar_contrasena;
        }

        return errors;
    }, [formattedAddress]);

    // Hook de validación con patrón híbrido (blur inicial + onChange en corrección)
    const { values, errors, handleChange, handleBlur, setErrors, touched } = useValidation<CompletarPerfilFormValues>(
        {
            dni: "",
            nombres: "",
            apellidos: "",
            fecha_nacimiento: "",
            lugar_nacimiento: "",
            genero: "",
            direccion_detalle: "",
            usuario: "",
            nueva_contrasena: "",
            confirmar_contrasena: "",
        },
        validateForm,
        {
            // Callback para limpiar errores del servidor cuando el usuario edita el campo
            onFieldChange: (field) => {
                setServerErrors((prev) => {
                    const { [field]: _, ...rest } = prev;
                    return rest;
                });
            }
        }
    );

    // Combinar errores de cliente y servidor
    const allErrors = { ...errors, ...serverErrors };

    useEffect(() => {
        if (touched.confirmar_contrasena) {
            const confirmarError = validateFieldRules(values.confirmar_contrasena, [
                requiredRule("Confirmar contraseña"),
                matchRule(() => values.nueva_contrasena, "Las contraseñas no coinciden."),
            ]);

            setErrors(prev => {
                if (confirmarError) {
                    if (prev.confirmar_contrasena === confirmarError) return prev;
                    return { ...prev, confirmar_contrasena: confirmarError };
                } else {
                    if (!prev.confirmar_contrasena) return prev;
                    const { confirmar_contrasena, ...rest } = prev;
                    return rest;
                }
            });
        }
    }, [values.nueva_contrasena, values.confirmar_contrasena, touched.confirmar_contrasena, setErrors]);

    // Validar dirección: si hay formattedAddress debe existir placeId
    useEffect(() => {
        if (formattedAddress && !placeId) {
            setErrors(prev => ({
                ...prev,
                direccion: "Por favor selecciona una dirección válida de las sugerencias."
            }));
        } else if (allErrors.direccion && placeId) {
            // Limpiar error si ahora hay placeId válido
            setErrors(prev => {
                const { direccion, ...rest } = prev;
                return rest;
            });
        }
    }, [formattedAddress, placeId, setErrors, allErrors.direccion]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                router.push("/panel-admin");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validar todo el formulario antes de enviar (incluye campos sin blur)
        const validationErrors = validateForm(values);
        setErrors(validationErrors);

        // Verificar que la contraseña sea válida
        if (!isPasswordValid(values.nueva_contrasena)) {
            setServerErrors({ form: "Por favor, completa todos los requisitos de la contraseña." });
            return;
        }

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);
        setServerErrors({});
        setSuccess(false);

        try {
            const formData = new FormData(e.currentTarget);
            const response = await completarPerfilAction(formData, formattedAddress, placeId);

            if (response.success) {
                setSuccess(true);
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

    return (
        <div className="animate-[fadeUp_0.6s_ease-out_both]">
            {/* ── Header ── */}
            <header className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 border-[3px] border-brand-accent rounded-full bg-brand-bg shadow-lg shadow-brand-accent/10 mb-4">
                    <svg className="w-10 h-10 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight mb-2 font-display">
                    Completar Perfil
                </h1>
                <div className="w-12 h-0.5 bg-brand-accent mx-auto rounded-full mb-3" />
                <p className="text-sm text-brand-secondary font-light max-w-lg mx-auto leading-relaxed">
                    Antes de acceder al panel de administración, por favor completa tu información personal y establece tu contraseña definitiva.
                </p>
            </header>

            {/* ── Form Card ── */}
            <div className="bg-white rounded-lg border border-brand-accent/25 shadow-[0_1px_3px_rgba(10,9,8,0.04),0_8px_30px_rgba(10,9,8,0.06)] p-6 md:p-8">
                <form onSubmit={handleSubmit} noValidate className="space-y-8">

                    {/* Mensajes de estado */}
                    {allErrors.form && (
                        <Alert variant="error">{allErrors.form}</Alert>
                    )}
                    {success && (
                        <Alert variant="success">
                            Perfil configurado exitosamente. Redirigiendo al panel de administración…
                        </Alert>
                    )}

                    {/* Datos personales */}
                    <PersonalDataFields
                        errors={allErrors}
                        values={{
                            dni: values.dni,
                            nombres: values.nombres,
                            apellidos: values.apellidos,
                            fecha_nacimiento: values.fecha_nacimiento,
                            lugar_nacimiento: values.lugar_nacimiento,
                            genero: values.genero as Genero,
                            direccion_detalle: values.direccion_detalle,
                        }}
                        onChange={(field, value) => handleChange(field as keyof CompletarPerfilFormValues, value)}
                        onBlur={(field) => handleBlur(field as keyof CompletarPerfilFormValues)}
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
                        </div>
                    </fieldset>

                    {/* Nueva contraseña */}
                    <fieldset className="space-y-5">
                        <legend className="text-base md:text-lg font-bold text-brand-primary uppercase tracking-widest pb-2 border-b border-brand-secondary/30 w-full">
                            Contraseña definitiva
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Input
                                    id="nueva_contrasena"
                                    name="nueva_contrasena"
                                    label="Nueva contraseña"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    value={values.nueva_contrasena}
                                    onChange={(e) => handleChange("nueva_contrasena", e.target.value)}
                                    onBlur={() => handleBlur("nueva_contrasena")}
                                    disabled={success}
                                />
                                <div className="mt-3">
                                    <PasswordStrengthIndicator password={values.nueva_contrasena} />
                                </div>
                            </div>
                            <Input
                                id="confirmar_contrasena"
                                name="confirmar_contrasena"
                                label="Confirmar nueva contraseña"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                value={values.confirmar_contrasena}
                                onChange={(e) => handleChange("confirmar_contrasena", e.target.value)}
                                onBlur={() => handleBlur("confirmar_contrasena")}
                                error={allErrors.confirmar_contrasena}
                                disabled={success}
                            />
                        </div>
                    </fieldset>

                    {/* Botón de envío */}
                    <div className="flex items-center justify-end pt-6 mt-8 border-t border-brand-accent/20">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-8"
                            disabled={loading || success || Object.keys(errors).length > 0}
                        >
                            {loading ? (
                                <>
                                    <svg className="text-brand-bg size-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Guardando...
                                </>
                            ) : success ? (
                                "✓ Perfil completado"
                            ) : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Completar y Guardar Perfil
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
