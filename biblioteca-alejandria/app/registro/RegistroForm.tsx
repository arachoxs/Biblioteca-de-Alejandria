"use client";

import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { Country } from "country-state-city";

const generoOptions = [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" },
];

const paisOptions = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
}));

export default function RegistroForm() {
    return (
        <form className="space-y-10">

            {/* Datos personales */}
            <fieldset className="space-y-5">
                <legend className="text-base md:text-lg font-bold text-brand-primary uppercase tracking-widest pb-2 border-b border-brand-secondary/30 w-full">
                    Datos personales
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                        id="dni"
                        name="dni"
                        label="DNI"
                        placeholder="12345678"
                        maxLength={8}
                        required
                    />
                    <Input
                        id="nombres"
                        name="nombres"
                        label="Nombres"
                        placeholder="Juan Carlos"
                        required
                    />
                    <Input
                        id="apellidos"
                        name="apellidos"
                        label="Apellidos"
                        placeholder="García López"
                        required
                    />
                    <Input
                        id="fecha_nacimiento"
                        name="fecha_nacimiento"
                        label="Fecha de nacimiento"
                        type="date"
                        required
                    />
                    <Select
                        id="lugar_nacimiento"
                        name="lugar_nacimiento"
                        label="Lugar de nacimiento"
                        options={paisOptions}
                        required
                    />
                    <Select
                        id="genero"
                        name="genero"
                        label="Género"
                        options={generoOptions}
                        required
                    />
                    <div className="sm:col-span-2">
                        <Input
                            id="direccion"
                            name="direccion"
                            label="Dirección de correspondencia"
                            placeholder="Av. Principal 123, Lima"
                            required
                        />
                    </div>
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
                        required
                    />
                    <Input
                        id="usuario"
                        name="usuario"
                        label="Nombre de usuario"
                        placeholder="juangarcia"
                        required
                    />
                    <Input
                        id="contrasena"
                        name="contrasena"
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                    <Input
                        id="confirmar_contrasena"
                        name="confirmar_contrasena"
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </fieldset>

            <Button type="submit">
                Crear cuenta
            </Button>

        </form>
    );
}
