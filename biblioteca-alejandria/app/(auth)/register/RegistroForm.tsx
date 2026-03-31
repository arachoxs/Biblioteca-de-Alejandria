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
import { useValidation } from "@/hooks/useValidation";

type RegistroFormValues = {
    dni: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: string;
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

    // Hook de validación en tiempo real
    const { values, errors, handleChange } = useValidation<RegistroFormValues>(
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
        (values) => {
            const validationErrors: Record<string, string> = {};

            // Validar DNI (5-20 caracteres alfanuméricos)
            if (values.dni && !/^[A-Za-z0-9]{5,20}$/.test(values.dni.trim())) {
                validationErrors.dni = "El documento debe tener entre 5 y 20 caracteres alfanuméricos.";
            }

            if(values.nombres!=null && values.nombres!== ""){ //solo realiza validacion cuando inicialmente se ponen espacios vacios
                if(values.nombres.trim()=== ""){
                    validationErrors.nombres = "El campo nombres no puede estar vacío.";
                }
            }

            if(values.apellidos!=null && values.apellidos!== ""){ //solo realiza validacion cuando inicialmente se ponen espacios vacios
                if(values.apellidos.trim()=== ""){
                    validationErrors.apellidos = "El campo apellidos no puede estar vacío.";
                }
            }

            // Validar fecha de nacimiento (18-80 años)
            if (values.fecha_nacimiento) {
                const fechaSeleccionada = new Date(values.fecha_nacimiento);
                const hoy = new Date();

                if (!isNaN(fechaSeleccionada.getTime())) {
                    let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
                    const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

                    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())) {
                        edad--;
                    }

                    if (fechaSeleccionada > hoy) {
                        validationErrors.fecha_nacimiento = "No puedes haber nacido en el futuro.";
                    } else if (edad < 18) {
                        validationErrors.fecha_nacimiento = "Debes tener al menos 18 años.";
                    } else if (edad > 80) {
                        validationErrors.fecha_nacimiento = "La edad máxima permitida es 80 años.";
                    }
                }
            }

            /*validar es un servicio externo por ende no se realizara instanteno
            // Validar dirección de correspondencia (debe tener place_id)
            if (formattedAddress && !placeId) {
                validationErrors.direccion = "Por favor selecciona una dirección válida de las sugerencias.";
            }
            */

            // Validar correo electrónico
            if (values.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) {
                validationErrors.correo = "El correo electrónico no es válido.";
            }

            // Validar contraseña (mínimo 8 caracteres)
            if (values.contrasena && values.contrasena.length < 8) {
                validationErrors.contrasena = "La contraseña debe tener al menos 8 caracteres.";
            }

            // Validar confirmación de contraseña
            if (values.confirmar_contrasena && values.contrasena !== values.confirmar_contrasena) {
                validationErrors.confirmar_contrasena = "Las contraseñas no coinciden.";
            }

            return validationErrors;
        }
    );

    // Combinar errores de cliente y servidor
    const allErrors = { ...errors, ...serverErrors };

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

        console.log(formattedAddress);
        
        // Validar que no haya errores del cliente antes de enviar
        if (Object.keys(errors).length > 0) {
            // No enviar si hay errores de validación
            return;
        }

        setLoading(true);
        setServerErrors({});
        setSuccess(false);

        try {
            const personalData: PersonalData = { //los valores son toman del hook de validacion, que se actualizan en tiempo real con el handleChange, y ademas se le agregan los datos de direccion formateada y placeId que se obtienen del componente de google autocomplete
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
        <form onSubmit={handleSubmit} className="space-y-10 w-full my-auto relative">

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
                onChange={(field, value) => handleChange(field as keyof RegistroFormValues, value)} //aca es donde aparece el custom hook
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
                            onChange={(e) => handleChange("contrasena", e.target.value)}
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
                        error={allErrors.confirmar_contrasena}
                    />
                </div>
            </fieldset>

            <div className="flex gap-5 flex-col">
                <Button type="submit" className="flex flex-row items-center justify-center gap-5"  disabled={loading /*|| Object.keys(errors).length > 0*/}>
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
