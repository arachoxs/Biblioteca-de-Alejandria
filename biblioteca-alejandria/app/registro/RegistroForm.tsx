"use client";

import { useState } from "react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import GoogleAutocomplete from "../components/GoogleAutocomplete";
import { Country } from "country-state-city";

const generoOptions = [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" },
];

const paisOptions = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: country.name,
}));

interface FormDataValues {
    dni: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: string;
    direccion: string;
    direccion_place_id: string;
    correo: string;
    usuario: string;
    contrasena: string;
    confirmar_contrasena: string;
}

export default function RegistroForm() {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [formattedAddress, setFormattedAddress] = useState("");
    const [placeId, setPlaceId] = useState("");

    const checkData = (data: FormDataValues): Record<string,string> => {
        const newErrors: Record<string, string> = {};

        try {            

            // Verificación de campos obligatorios
            const requiredFields = [
                "dni", "nombres", "apellidos", "fecha_nacimiento", 
                "lugar_nacimiento", "genero", "direccion", 
                "correo", "usuario", "contrasena", "confirmar_contrasena","direccion_place_id",
            ];

            const fechaSeleccionada = new Date(data.fecha_nacimiento);
            const hoy = new Date();

            for (const field of requiredFields) {
                const value = data[field as keyof FormDataValues];
                if (typeof value !== "string" || value.trim() === "") {
                    newErrors[field] = "Este campo es obligatorio.";
                }
            }

            // Validaciones específicas
            if (!newErrors.dni && data.dni.length <= 7) {
                newErrors.dni = "El DNI debe tener al menos 7 dígitos.";
            }

            if (!newErrors.fecha_nacimiento && Number.isNaN(fechaSeleccionada.getTime())) {
                newErrors.fecha_nacimiento = "La fecha de nacimiento no es valida.";
            }

            if (!newErrors.fecha_nacimiento) {
                let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
                const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

                if (
                    diferenciaMeses < 0 ||
                    (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())
                ) {
                    edad--;
                }

                if (fechaSeleccionada > hoy) {
                    newErrors.fecha_nacimiento = "No puedes haber nacido en el futuro.";
                } else if (edad < 18) {
                    newErrors.fecha_nacimiento = "Debes tener al menos 18 años.";
                } else if (edad > 80) {
                    newErrors.fecha_nacimiento = "La edad máxima permitida es 80 años.";
                }
            }

            if (!newErrors.contrasena && data.contrasena.length < 6) {
                newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres.";
            }

            if (!newErrors.confirmar_contrasena && data.contrasena !== data.confirmar_contrasena) {
                newErrors.confirmar_contrasena = "Las contraseñas no coinciden.";
            }

            if(!newErrors.direccion_place_id && !data.direccion_place_id) {
                newErrors.direccion = "Por favor selecciona una dirección válida de las sugerencias.";
            }

        } catch (err: unknown) {
            console.error(err);
            setErrors({ form: "Ocurrió un error inesperado." });
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            
            const formData = new FormData(e.currentTarget);

            const data = {
                dni: formData.get("dni") as string,
                nombres: formData.get("nombres") as string,
                apellidos: formData.get("apellidos") as string,
                fecha_nacimiento: formData.get("fecha_nacimiento") as string,
                lugar_nacimiento: formData.get("lugar_nacimiento") as string,
                genero: formData.get("genero") as string,
                direccion: formattedAddress,
                direccion_place_id: placeId,
                correo: formData.get("correo") as string,
                usuario: formData.get("usuario") as string,
                contrasena: formData.get("contrasena") as string,
                confirmar_contrasena: formData.get("confirmar_contrasena") as string,
            };

            console.log(data)

            const newErrors = checkData(data);
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setLoading(false);
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));

            // TODO: Agregar lógica de subida al servidor aquí
            /*
            Flujo:
                1. Validar datos del formulario.
                2. Crear usuario Auth con role CLIENTE.
                3. Insertar en Usuario con id = auth_user.id.
                4. Guardar solo datos de perfil (sin correo/password en Usuario).
            */
            
            console.log(data);
            setSuccess(true);
            //reset Formulario
            //setFormattedAddress("");
            //setPlaceId("");
            // e.currentTarget.reset(); 

        } catch (err: unknown) {
            console.error(err);
            setErrors({ form: "Ocurrió un error inesperado." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 relative">

            {/* Mensajes de estado globales */}
            {errors.form && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {errors.form}
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 border absolute left-1/2 -translate-x-1/2 border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                    Registro exitoso. ¡Bienvenido!
                </div>
            )}

            {/* Datos personales */}
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
                    //required
                    error={errors.dni}
                    />
                    <Input
                        id="nombres"
                        name="nombres"
                        label="Nombres"
                        placeholder="Juan Carlos"
                        //required
                        error={errors.nombres}
                    />
                    <Input
                    id="apellidos"
                    name="apellidos"
                    label="Apellidos"
                    placeholder="García López"
                    //required
                    error={errors.apellidos}
                    />
                    <Input
                        id="fecha_nacimiento"
                        name="fecha_nacimiento"
                        label="Fecha de nacimiento"
                        type="date"
                        //required
                        error={errors.fecha_nacimiento}
                    />
            
                    <Select
                        id="lugar_nacimiento"
                        name="lugar_nacimiento"
                        label="Lugar de nacimiento"
                        options={paisOptions}
                        //required
                        error={errors.lugar_nacimiento}
                    />
                    <Select
                        id="genero"
                        name="genero"
                        label="Género"
                        options={generoOptions}
                        //required
                        error={errors.genero}
                    />

                    <GoogleAutocomplete
                        id="direccion_autocomplete"
                        name="direccion_autocomplete"
                        label="Direccion de correspondencia"
                        placeholder="cra 12 #34-56, Bogotá"
                        //required
                        onPlaceSelect={(selectedPlaceId) => setPlaceId(selectedPlaceId)}
                        onFormattedAddressSelect={(addressText) => setFormattedAddress(addressText)}
                        error={errors.direccion}
                    />

                    <Input
                        id="direccion_detalle"
                        name="direccion_detalle"
                        label="Detalle de la dirección"
                        placeholder="Apto 101, Piso 2"
                        //required
                        error={errors.direccion_detalle}
                    />

                    <input type="hidden" id="direccion" name="direccion" value={formattedAddress} />
                    <input type="hidden" id="direccion_place_id" name="direccion_place_id" value={placeId} />
                </div>
            </fieldset>

            {/* Datos de acceso */}
            <fieldset className="space-y-5">
                <legend className="text-base md:text-lg font-bold text-brand-primary uppercase tracking-widest pb-2 border-b border-brand-secondary/30 w-full">
                    Datos de acceso
                </legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        id="correo"
                        name="correo"
                        label="Correo electrónico"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        //required
                        error={errors.correo}
                    />
                    <Input
                        id="usuario"
                        name="usuario"
                        label="Nombre de usuario"
                        placeholder="juangarcia"
                        //required
                        error={errors.usuario}
                    />
                    <Input
                        id="contrasena"
                        name="contrasena"
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        //required
                        error={errors.contrasena}
                    />
                    <Input
                        id="confirmar_contrasena"
                        name="confirmar_contrasena"
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="••••••••"
                        //required
                        error={errors.confirmar_contrasena}
                    />
                </div>
            </fieldset>

            <Button type="submit" className="flex flex-row items-center justify-center gap-5" disabled={loading}>
                {loading ? (
                    <>
                        <svg className="text-brand-text size-5 animate-spin" viewBox="0 0 24 24"></svg>
                        Procesando
                    </>
                ) : "Crear cuenta"}
            </Button>

        </form>
    );
}
