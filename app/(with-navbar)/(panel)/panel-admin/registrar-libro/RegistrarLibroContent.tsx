"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import AuthorFormModal from "../autores/AuthorFormModal";
import CategoryFormModal from "../categorias/CategoryFormModal";
import { useValidation } from "@/hooks/useValidation";
import { validateLibro } from "@/lib/validations/libro";
import { DEFAULT_ANCHO, DEFAULT_ALTO } from "@/lib/types/modelo_ra";
import {
  BookPlus,
  Loader2,
} from "lucide-react";
import {
  crearLibroAction,
  getAuthorOptionsAction,
  getCategoryOptionsAction,
} from "../libros/action";
import { createCategoryAction } from "../categorias/action";
import type { LibroActionResponse } from "@/lib/types/libro";
import { validateInventarioCantidad } from "@/lib/validations/libro";
import { MAX_COPIAS_POR_INSERCION } from "@/lib/validations/rules";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import {
  LibroBasicInfoSection,
  LibroDetailsSection,
  LibroClassificationSection,
  LibroRASection,
} from "@/components/libros/LibroFormSections";
import Input from "@/components/ui/Input";
import { PackagePlus } from "lucide-react";

// ─── Form values ───────────────────────────────────────────────────

interface LibroFormValues extends Record<string, unknown> {
  titulo: string;
  isbn: string;
  idioma: string;
  sinopsis: string;
  paginas: string;
  precio: string;
  estado: string;
  id_autor: string;
  id_categoria: string;
  fecha_publicacion: string;
  editorial: string;
  inv_cantidad: string;
}

const INITIAL_VALUES: LibroFormValues = {
  titulo: "",
  isbn: "",
  idioma: "",
  sinopsis: "",
  paginas: "",
  precio: "",
  estado: "",
  id_autor: "",
  id_categoria: "",
  fecha_publicacion: "",
  editorial: "",
  inv_cantidad: "",
};

function validateForm(values: LibroFormValues): Record<string, string> {
  const errors = validateLibro({
    titulo: values.titulo,
    isbn: values.isbn,
    idioma: values.idioma,
    sinopsis: values.sinopsis,
    paginas: values.paginas,
    precio: values.precio,
    estado: values.estado,
    id_autor: values.id_autor,
    id_categoria: values.id_categoria,
    fecha_publicacion: values.fecha_publicacion,
    editorial: values.editorial,
  });

  const cantidadErr = validateInventarioCantidad(values.inv_cantidad);
  if (cantidadErr) {
    errors.inv_cantidad = cantidadErr;
  }

  return errors;
}

// ─── Helpers ───────────────────────────────────────────────────────

function areAllFieldsFilled(values: LibroFormValues): boolean {
  const requiredFields = [
    "titulo", "isbn", "idioma", "sinopsis", "paginas",
    "fecha_publicacion", "precio", "estado", "id_autor",
    "id_categoria", "editorial", "inv_cantidad",
  ] as const;
  return requiredFields.every((field) => values[field].trim() !== "");
}

function LibroInventarioSection({ values, errors, handleChange, handleBlur, isSubmitting }: {
  values: LibroFormValues;
  errors: Record<string, string>;
  handleChange: (field: string, value: string) => void;
  handleBlur: (field: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-brand-accent/10 pb-3">
        <PackagePlus className="w-5 h-5 text-brand-primary" />
        <div>
          <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight">
            Inventario Inicial
          </h2>
          <p className="text-xs text-brand-secondary mt-0.5">
            Indica la cantidad de copias a enviar a bodega principal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input
          id="libro-inv-cantidad"
          label="Cantidad de copias"
          type="number"
          min={1}
          max={MAX_COPIAS_POR_INSERCION}
          step={1}
          placeholder="Ej: 5"
          value={values.inv_cantidad}
          onChange={(e) => handleChange("inv_cantidad", e.target.value)}
          onBlur={() => handleBlur("inv_cantidad")}
          error={errors.inv_cantidad}
          required
          disabled={isSubmitting}
        />
      </div>
    </section>
  );
}

// ─── Componente principal ──────────────────────────────────────────

export default function RegistrarLibroContent() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<LibroActionResponse | null>(null);

  // Opciones selects
  const [authorOptions, setAuthorOptions] = useState<SearchableSelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SearchableSelectOption[]>([]);

  // Modales reutilizados
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Estado RA
  const [raDimensiones, setRaDimensiones] = useState({
    ancho: String(DEFAULT_ANCHO),
    alto: String(DEFAULT_ALTO),
  });
  const raTexturasRef = useRef<Partial<Record<"portada" | "contraportada" | "lomo", File>>>({});

  const { values, errors, handleChange, handleBlur, setErrors, reset } =
    useValidation<LibroFormValues>(INITIAL_VALUES, validateForm, {
      onFieldChange: () => setAlertState(null),
    });

  // ─── Carga opciones ────────────────────────────────────────────

  const loadAuthorOptions = useCallback(async () => {
    try {
      const res = await getAuthorOptionsAction();
      if (res.success && res.data) setAuthorOptions(res.data);
    } catch (err) {
      console.error("Error cargando autores:", err);
    }
  }, []);

  const loadCategoryOptions = useCallback(async () => {
    try {
      const res = await getCategoryOptionsAction();
      if (res.success && res.data) setCategoryOptions(res.data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      loadAuthorOptions(),
      loadCategoryOptions(),
    ]);
  }, [loadAuthorOptions, loadCategoryOptions]);

  // ─── Submit ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertState(null);

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: Record<string, string> = {
        titulo: values.titulo,
        isbn: values.isbn,
        idioma: values.idioma,
        sinopsis: values.sinopsis,
        paginas: values.paginas,
        precio: values.precio,
        estado: values.estado,
        id_autor: values.id_autor,
        id_categoria: values.id_categoria,
        fecha_publicacion: values.fecha_publicacion,
        editorial: values.editorial,
      };

      const parsedCantidad = Number(values.inv_cantidad);
      const response = await crearLibroAction(formData, parsedCantidad);
      setAlertState(response);

      if (response.success) {
        reset();
        setTimeout(() => router.push("/panel-admin/libros"), 1500);
      } else if (response.errors) {
        setErrors((prev) => ({ ...prev, ...response.errors }));
      }
    } catch {
      setAlertState({
        success: false,
        message: "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Callbacks modals ──────────────────────────────────────────

  const handleAuthorCreated = async (id?: number | string) => {
    await loadAuthorOptions();
    if (id) {
      handleChange("id_autor", String(id));
    }
  };

  const handleCategoryCreated = async (id?: number | string) => {
    await loadCategoryOptions();
    if (id) {
      handleChange("id_categoria", String(id));
    }
  };

  const handleRaDimensionesChange = useCallback(
    (field: "ancho" | "alto", value: string) => {
      setRaDimensiones((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleRaTexturasChange = useCallback(
    (files: Partial<Record<"portada" | "contraportada" | "lomo", File>>) => {
      raTexturasRef.current = files;
    },
    [],
  );

  const canSubmit = areAllFieldsFilled(values) && Object.keys(errors).length === 0;

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <BackLink href="/panel-admin/libros" label="Volver a libros" />

      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
          Registrar Libro
        </h1>
        <p className="text-brand-secondary text-sm md:text-base mt-2 leading-relaxed">
          Completa la información bibliográfica para agregar un nuevo libro al catálogo.
        </p>
      </div>

      {/* Alertas */}
      {alertState?.message && (
        <Alert
          variant={alertState.success ? "success" : "error"}>
          {alertState.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
        <LibroBasicInfoSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting}
        />

        <LibroDetailsSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting}
        />

        <LibroClassificationSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting}
          authorOptions={authorOptions}
          categoryOptions={categoryOptions}
          onOpenAuthorModal={() => setIsAuthorModalOpen(true)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        />

        <LibroInventarioSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting}
        />

        <LibroRASection
          paginas={Number(values.paginas) || 0}
          disabled={isSubmitting}
          errors={errors}
          dimensiones={raDimensiones}
          onDimensionesChange={handleRaDimensionesChange}
          onTexturasChange={handleRaTexturasChange}
        />

        {/* ── Acciones ────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 pb-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/panel-admin/libros")}
            disabled={isSubmitting}
            className="w-auto px-6 py-2 text-sm">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="w-auto px-8 py-2 text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <BookPlus className="w-4 h-4" />
                Registrar Libro
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ── Modales reutilizados ──────────────────────────────────── */}
      <AuthorFormModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onSuccess={handleAuthorCreated}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva Categoría"
        submitLabel="Crear Categoría"
        loadingLabel="Creando..."
        initialValues={{ nombre: "", descripcion: "" }}
        onSubmit={(payload) => createCategoryAction(payload)}
        onSuccess={handleCategoryCreated}
      />
    </main>
  );
}
