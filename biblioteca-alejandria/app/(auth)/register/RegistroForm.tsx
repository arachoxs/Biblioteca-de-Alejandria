"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PersonalDataFields from "@/components/PersonalDataFields";
import type { CredentialData, PersonalData, Genero } from "@/lib/types/auth";
import { registerUser } from "./actions";
import { useValidation } from "@/hooks/useValidation";
import {
    validateFieldRules,
    requiredRule,
    dniRule,
    notBlankRule,
    ageRule,
    emailRule,
    passwordRule,
    matchRule,
    usernameRule,
    requiredPasswordRule,
} from "@/lib/validations/rules";

type RegistroFormValues = {
    dni: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: Genero | "";
    direccion_detalle: string;
    usuario: string;
    correo: string;
    contrasena: string;
    confirmar_contrasena: string;
};

export default function RegistroForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState("");
    const [placeId, setPlaceId] = useState("");

    // Función de validación usando reglas atómicas de rules.ts
    const validateForm = useCallback((values: RegistroFormValues): Record<string, string> => {
        const errors: Record<string, string> = {};

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

        // Validar correo
        const correoError = validateFieldRules(values.correo, [requiredRule("Correo electrónico"), emailRule()]);
        if (correoError) errors.correo = correoError;

        // Validar contraseña
        const contrasenaError = validateFieldRules(values.contrasena, [requiredPasswordRule(), passwordRule()]);
        if (contrasenaError) errors.contrasena = contrasenaError;

        // Validar confirmación de contraseña
        const confirmarError = validateFieldRules(values.confirmar_contrasena, [
            requiredRule("Confirmar contraseña"),
            matchRule(() => values.contrasena, "Las contraseñas no coinciden."),
        ]);
        if (confirmarError) errors.confirmar_contrasena = confirmarError;

        return errors;
    }, []);

    // Hook de validación con patrón híbrido (blur inicial + onChange en corrección)
    const { values, errors, handleChange, handleBlur, setErrors } = useValidation<RegistroFormValues>(
        {
            dni: "",
            nombres: "",
            apellidos: "",
            fecha_nacimiento: "",
            lugar_nacimiento: "",
            genero: "",
            direccion_detalle: "",
            usuario: "",
            correo: "",
            contrasena: "",
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
    
    // Wrapper para manejar cambios en contraseña y revalidar confirmar_contrasena
    const handlePasswordChange = useCallback((field: keyof RegistroFormValues, value: unknown) => {
        handleChange(field, value);
        
        // Si cambió contrasena Y confirmar_contrasena tiene error → revalidar inmediatamente
        if (field === "contrasena" && errors.confirmar_contrasena) {
            const newValues = { ...values, contrasena: value as string };
            const confirmarError = validateFieldRules(newValues.confirmar_contrasena, [
                requiredRule("Confirmar contraseña"),
                matchRule(() => newValues.contrasena, "Las contraseñas no coinciden.")
            ]);
            
            setErrors((prev) => {
                if (confirmarError) {
                    return { ...prev, confirmar_contrasena: confirmarError };
                } else {
                    const { confirmar_contrasena: _, ...rest } = prev;
                    return rest;
                }
            });
        }
    }, [handleChange, errors.confirmar_contrasena, values, setErrors]);

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
                router.push("/");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validar todo el formulario antes de enviar (incluye campos sin blur)
        const validationErrors = validateForm(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);
        setServerErrors({});
        setSuccess(false);

        try {
            const personalData: PersonalData = {
                dni: values.dni,
                nombres: values.nombres,
                apellidos: values.apellidos,
                fecha_nacimiento: values.fecha_nacimiento,
                lugar_nacimiento: values.lugar_nacimiento,
                genero: values.genero as Genero,
                direccion: formattedAddress,
                direccion_place_id: placeId,
                direccion_detalle: values.direccion_detalle,
                usuario: values.usuario,
            };

            const credentialData: CredentialData = {
                correo: values.correo,
                contrasena: values.contrasena,
                confirmar_contrasena: values.confirmar_contrasena,
            };

            const response = await registerUser(credentialData, personalData);

            if (response.success) {
                setSuccess(true);
                setServerErrors({});
            } else {
                // Inyectar errores del servidor en el hook
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
        <form onSubmit={handleSubmit} noValidate className="space-y-10 w-full my-auto relative">

            {/* Mensajes de estado globales */}
            {allErrors.form && (
                <Alert variant="error">
                    {allErrors.form}
                </Alert>
            )}

            {success && (
                <Alert variant="success" className="absolute left-1/2 -translate-x-1/2 z-50">
                    Registro exitoso. ¡Bienvenido!
                </Alert>
            )}

            {/* Datos personales — componente reutilizable */}
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
                onChange={(field, value) => handleChange(field as keyof RegistroFormValues, value)}
                onBlur={(field) => handleBlur(field as keyof RegistroFormValues)}
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
                    <Input
                        id="correo"
                        name="correo"
                        label="Correo electrónico"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        required
                        value={values.correo}
                        onChange={(e) => handleChange("correo", e.target.value)}
                        onBlur={() => handleBlur("correo")}
                        error={allErrors.correo}
                    />
                    <div>
                        <Input
                            id="contrasena"
                            name="contrasena"
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={values.contrasena}
                            onChange={(e) => handlePasswordChange("contrasena", e.target.value)}
                            onBlur={() => handleBlur("contrasena")}
                            error={allErrors.contrasena}
                        />
                        <span className={`text-xs text-brand-accent font-light mt-1 block ${allErrors.contrasena ? "invisible" : ""}`}>
                            Mínimo 8 caracteres.
                        </span>
                    </div>
                    <Input
                        id="confirmar_contrasena"
                        name="confirmar_contrasena"
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={values.confirmar_contrasena}
                        onChange={(e) => handleChange("confirmar_contrasena", e.target.value)}
                        onBlur={() => handleBlur("confirmar_contrasena")}
                        error={allErrors.confirmar_contrasena}
                    />
                </div>
            </fieldset>

            <div className="flex gap-5 flex-col">
                <Button type="submit" className="flex flex-row items-center justify-center gap-5" disabled={loading || Object.keys(errors).length > 0}>
                    {loading ? (
                        <>
                            <svg className="text-brand-text size-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                            Procesando
                        </>
                    ) : "Crear cuenta"}
                </Button>

                <p className="text-center text-sm text-brand-secondary font-light">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-brand-primary font-semibold hover:underline underline-offset-2 transition-all">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>

        </form>
    );
}
