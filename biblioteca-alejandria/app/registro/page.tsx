import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const generoOptions = [
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
    { value: "otro", label: "Otro" },
];

export default function Registro() {
return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center w-full">
        <div className="lg:w-9/12 md:mx-4 flex lg:flex-row flex-col w-full md:rounded-2xl mx-auto grainy-glass">

            <header className="text-center flex flex-1 rounded-b-2xl md:rounded-2xl flex-col items-center justify-center px-10 py-6 relative overflow-hidden">
                {/* Imagen de fondo desenfocada */}
                <div className="absolute inset-0 bg-cover bg-center bg-[url(/libros_banner.jpeg)] blur-sm scale-110" />
                {/* Overlay oscuro para legibilidad del texto */}
                <div className="absolute inset-0 bg-black-primary/60" />
                <h1 className="relative z-10 text-4xl font-bold text-white mb-3 tracking-tight">
                    Crear una cuenta
                </h1>
                <p className="relative z-10 text-2xs md:text-lg text-white/85 leading-relaxed max-w-md mx-auto">
                    Crea una cuenta para poder acceder a todas las funcionalidades de la Biblioteca de Alejandría
                </p>
                <div className="relative z-10 mt-6 h-px bg-linear-to-r from-transparent via-brand-accent to-transparent" />
            </header>

            <main className="flex-2 px-4 md:px-10 py-6">
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
                    <Input
                    id="lugar_nacimiento"
                    name="lugar_nacimiento"
                    label="Lugar de nacimiento"
                    placeholder="Lima, Perú"
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
            </main>

        </div>
    </div>
);
}