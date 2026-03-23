"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PersonalDataFields from "@/components/PersonalDataFields";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { completarPerfilAction } from "./actions";
import { validatePasswordRule } from "@/lib/validations/auth";

// ─── Componente ────────────────────────────────────────────────────

export default function CompletarPerfilAdmin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState("");
    const [placeId, setPlaceId] = useState("");

    // Validación en tiempo real de contraseñas
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    const passwordMismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;
    const passwordRuleError = newPwd.length > 0 ? validatePasswordRule(newPwd) : null;
    const canSubmit = !passwordMismatch && !passwordRuleError && !loading && !success;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            const formData = new FormData(e.currentTarget);
            const response = await completarPerfilAction(formData, formattedAddress, placeId);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => router.push("/panel-admin"), 2000);
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
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Mensajes de estado */}
                    {errors.form && (
                        <Alert variant="error">{errors.form}</Alert>
                    )}
                    {success && (
                        <Alert variant="success">
                            Perfil configurado exitosamente. Redirigiendo al panel de administración…
                        </Alert>
                    )}

                    {/* Datos personales */}
                    <PersonalDataFields
                        errors={errors}
                        defaultValues={{}}
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
                                    value={newPwd}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPwd(e.target.value)}
                                    error={errors.nueva_contrasena || passwordRuleError || undefined}
                                    disabled={success}
                                />
                                <span className="text-xs text-brand-accent font-light mt-1 block">
                                    Mínimo 8 caracteres.
                                </span>
                            </div>
                            <Input
                                id="confirmar_contrasena"
                                name="confirmar_contrasena"
                                label="Confirmar nueva contraseña"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                value={confirmPwd}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPwd(e.target.value)}
                                error={errors.confirmar_contrasena || (passwordMismatch ? "Las contraseñas no coinciden." : undefined)}
                                disabled={success}
                            />
                        </div>
                    </fieldset>

                    {/* Botón de envío */}
                    <div className="flex items-center justify-end pt-6 mt-8 border-t border-brand-accent/20">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-8"
                            disabled={!canSubmit}
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
