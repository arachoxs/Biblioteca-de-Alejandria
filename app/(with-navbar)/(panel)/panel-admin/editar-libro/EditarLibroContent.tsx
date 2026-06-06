"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import AuthorFormModal from "../autores/AuthorFormModal";
import CategoryFormModal from "../categorias/CategoryFormModal";
import { useValidation } from "@/hooks/useValidation";
import { validateLibro } from "@/lib/validations/libro";
import { DEFAULT_ANCHO, DEFAULT_ALTO } from "@/lib/types/modelo_ra";
import type { ModeloRADimensiones, ModeloRATexturasLibro } from "@/lib/types/modelo_ra";
import {
  Save,
  Loader2,
} from "lucide-react";
import {
  editarLibroAction,
  getAuthorOptionsAction,
  getCategoryOptionsAction,
  getLibroByIdAction,
  getModeloRAByLibroAction,
  actualizarDimensionesRAAction,
  subirTexturasRAAction,
} from "../libros/action";
import { createCategoryAction } from "../categorias/action";
import type { LibroActionResponse } from "@/lib/types/libro";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import {
  LibroBasicInfoSection,
  LibroDetailsSection,
  LibroClassificationSection,
  LibroRASection,
} from "@/components/libros/LibroFormSections";
import type { LibroFormValues } from "@/components/libros/LibroFormSections";

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
};

function validateForm(values: LibroFormValues): Record<string, string> {
  return validateLibro({
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
}

// ─── Module-level helpers ───────────────────────────────────────────

type OptionsSetter = (opts: SearchableSelectOption[]) => void;

async function loadOptionsAction(
  fetcher: () => Promise<{ success: boolean; data?: SearchableSelectOption[] }>,
  setter: OptionsSetter,
  errorLabel: string,
) {
  try {
    const res = await fetcher();
    if (res.success && res.data) setter(res.data);
  } catch (err) {
    console.error(`Error cargando ${errorLabel}:`, err);
  }
}

async function loadRADataAction(
  libroId: string,
  setModeloRAId: (id: number | null) => void,
  setRaDimensiones: (d: { ancho: string; alto: string }) => void,
  setExistingTexturas: (t: { portada: string | null; contraportada: string | null; lomo: string | null }) => void,
) {
  try {
    const raResult = await getModeloRAByLibroAction(libroId);
    if (!raResult?.success || !raResult.data) return;

    const raData = raResult.data;
    setModeloRAId(raData.id);
    const dim = raData.dimensiones as unknown as ModeloRADimensiones;
    if (dim) {
      setRaDimensiones({
        ancho: String(dim.ancho ?? DEFAULT_ANCHO),
        alto: String(dim.alto ?? DEFAULT_ALTO),
      });
    }
    const tex = raData.texturas as unknown as ModeloRATexturasLibro;
    if (tex) {
      setExistingTexturas({
        portada: tex.portada ?? null,
        contraportada: tex.contraportada ?? null,
        lomo: tex.lomo ?? null,
      });
    }
  } catch {
    // RA load failure shouldn't block libro loading
  }
}

function populateLibroForm(
  libro: NonNullable<Awaited<ReturnType<typeof getLibroByIdAction>>>,
  setValues: (v: LibroFormValues) => void,
) {
  setValues({
    titulo: libro.titulo || "",
    isbn: libro.isbn || "",
    idioma: libro.idioma || "",
    sinopsis: libro.sipnosis || "",
    paginas: String(libro.paginas ?? ""),
    precio: String(libro.precio ?? ""),
    estado: libro.estado || "",
    id_autor: String(libro.id_autor ?? ""),
    id_categoria: String(libro.id_categoria ?? ""),
    fecha_publicacion: libro.fecha_publicacion || "",
    editorial: libro.editorial || "",
  });
}

// ─── Componente ────────────────────────────────────────────────────

export default function EditarLibroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const libroId = searchParams.get("id") ?? "";

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<LibroActionResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [authorOptions, setAuthorOptions] = useState<SearchableSelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SearchableSelectOption[]>([]);

  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [modeloRAId, setModeloRAId] = useState<number | null>(null);
  const [raDimensiones, setRaDimensiones] = useState({
    ancho: String(DEFAULT_ANCHO),
    alto: String(DEFAULT_ALTO),
  });
  const [existingTexturas, setExistingTexturas] = useState<{
    portada: string | null;
    contraportada: string | null;
    lomo: string | null;
  }>({ portada: null, contraportada: null, lomo: null });
  const raTexturasRef = useRef<Partial<Record<"portada" | "contraportada" | "lomo", File>>>({});

  const { values, errors, handleChange, handleBlur, setValues, setErrors } =
    useValidation<LibroFormValues>(INITIAL_VALUES, validateForm, {
      onFieldChange: () => setAlertState(null),
    });

  useEffect(() => {
    if (!libroId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [libro] = await Promise.all([
          getLibroByIdAction(libroId),
          loadOptionsAction(getAuthorOptionsAction, setAuthorOptions, "autores"),
          loadOptionsAction(getCategoryOptionsAction, setCategoryOptions, "categorías"),
        ]);

        if (!libro) {
          setNotFound(true);
          return;
        }

        populateLibroForm(libro, setValues);
        await loadRADataAction(libroId, setModeloRAId, setRaDimensiones, setExistingTexturas);
      } catch (err) {
        console.error("Error cargando libro:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAll();
  }, [libroId, setValues]);

  // ─── Submit ────────────────────────────────────────────────────

  const updateModeloRAData = useCallback(async (libroId: string, paginas: string) => {
    if (!modeloRAId) return;

    const dimFormData: Record<string, string> = {
      ra_ancho: raDimensiones.ancho,
      ra_alto: raDimensiones.alto,
      ra_profundidad: String(Math.round((Number(paginas) || 0) * 0.007 * 100) / 100),
    };
    await actualizarDimensionesRAAction(modeloRAId, dimFormData).catch(
      (err) => console.error("Error actualizando dimensiones RA:", err),
    );

    if (Object.keys(raTexturasRef.current).length > 0) {
      const texFormData = new FormData();
      for (const [tipo, file] of Object.entries(raTexturasRef.current)) {
        if (file) texFormData.append(`ra_${tipo}`, file);
      }
      await subirTexturasRAAction(modeloRAId, libroId, texFormData).catch(
        (err) => console.error("Error subiendo texturas RA:", err),
      );
    }
  }, [modeloRAId, raDimensiones]);

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

      const response = await editarLibroAction(libroId, formData);
      setAlertState(response);

      if (response.success) {
        await updateModeloRAData(libroId, values.paginas);
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
    await loadOptionsAction(getAuthorOptionsAction, setAuthorOptions, "autores");
    if (id) handleChange("id_autor", String(id));
  };

  const handleCategoryCreated = async (id?: number | string) => {
    await loadOptionsAction(getCategoryOptionsAction, setCategoryOptions, "categorías");
    if (id) handleChange("id_categoria", String(id));
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

  const canSubmit =
    values.titulo.trim() !== "" &&
    values.isbn.trim() !== "" &&
    values.idioma.trim() !== "" &&
    values.sinopsis.trim() !== "" &&
    values.paginas.trim() !== "" &&
    values.precio.trim() !== "" &&
    values.estado.trim() !== "" &&
    values.id_autor.trim() !== "" &&
    values.id_categoria.trim() !== "" &&
    values.fecha_publicacion.trim() !== "" &&
    values.editorial.trim() !== "" &&
    Object.keys(errors).length === 0;

  // ─── Loading / Not found ───────────────────────────────────────

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          <p className="text-brand-secondary">Cargando libro...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-brand-secondary text-lg">
            Libro no encontrado o fue eliminado.
          </p>
          <BackLink href="/panel-admin/libros" label="Volver a libros" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <BackLink href="/panel-admin/libros" label="Volver a libros" />

      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
          Editar Libro
        </h1>
        <p className="text-brand-secondary text-sm md:text-base mt-2 leading-relaxed">
          Modifica la información bibliográfica del libro seleccionado.
        </p>
      </div>

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
          isSubmitting={isSubmitting} idPrefix="edit-"
        />

        <LibroDetailsSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting} idPrefix="edit-"
        />

        <LibroClassificationSection
          values={values} errors={errors}
          handleChange={handleChange} handleBlur={handleBlur}
          isSubmitting={isSubmitting} idPrefix="edit-"
          authorOptions={authorOptions}
          categoryOptions={categoryOptions}
          onOpenAuthorModal={() => setIsAuthorModalOpen(true)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        />

        <LibroRASection
          paginas={Number(values.paginas) || 0}
          disabled={isSubmitting}
          errors={{}}
          dimensiones={raDimensiones}
          onDimensionesChange={handleRaDimensionesChange}
          existingTexturas={existingTexturas}
          onTexturasChange={handleRaTexturasChange}
        />

        {/* Acciones */}
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modales */}
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
