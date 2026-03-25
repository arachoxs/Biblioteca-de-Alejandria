"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PersonalDataFields from "@/components/PersonalDataFields";
import { CredentialData, PersonalData, Genero } from "@/lib/types/auth";
import { registerUser } from "./actions";

export default function RegistroForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState("");
    const [placeId, setPlaceId] = useState("");

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
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            const formData = new FormData(e.currentTarget);

            const personalData: PersonalData = {
                dni: formData.get("dni") as string,
                nombres: formData.get("nombres") as string,
                apellidos: formData.get("apellidos") as string,
                fecha_nacimiento: formData.get("fecha_nacimiento") as string,
                lugar_nacimiento: formData.get("lugar_nacimiento") as string,
                genero: formData.get("genero") as Genero,
                direccion: formattedAddress,
                direccion_place_id: placeId,
                direccion_detalle: formData.get("direccion_detalle") as string,
                usuario: formData.get("usuario") as string,
            };

            const credentialData: CredentialData = {
                correo: formData.get("correo") as string,
                contrasena: formData.get("contrasena") as string,
                confirmar_contrasena: formData.get("confirmar_contrasena") as string,
            };

            const response = await registerUser(credentialData, personalData);

            if (response.success) {
                setSuccess(true);
                setErrors({});
            } else {
                setErrors(response.errors || { form: response.message || "Error desconocido" });
            }

        } catch (err: unknown) {
            console.error(err);
            setErrors({ form: "Ocurrió un error inesperado." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 w-full my-auto relative">

            {/* Mensajes de estado globales */}
            {errors.form && (
                <Alert variant="error">
                    {errors.form}
                </Alert>
            )}

            {success && (
                <Alert variant="success" className="absolute left-1/2 -translate-x-1/2 z-50">
                    Registro exitoso. ¡Bienvenido!
                </Alert>
            )}

            {/* Datos personales — componente reutilizable */}
            <PersonalDataFields
                errors={errors}
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
                        error={errors.usuario}
                    />
                    <Input
                        id="correo"
                        name="correo"
                        label="Correo electrónico"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        required
                        error={errors.correo}
                    />
                    <div>
                        <Input
                            id="contrasena"
                            name="contrasena"
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            required
                            error={errors.contrasena}
                        />
                        <span className="text-xs text-brand-accent font-light mt-1 block">
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
                        error={errors.confirmar_contrasena}
                    />
                </div>
            </fieldset>

            <div className="flex gap-5 flex-col">
                <Button type="submit" className="flex flex-row items-center justify-center gap-5" disabled={loading}>
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
