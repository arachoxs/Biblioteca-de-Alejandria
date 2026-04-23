"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import AuthorFormModal from "../autores/AuthorFormModal";
import CategoryFormModal from "../categorias/CategoryFormModal";
import { useValidation } from "@/hooks/useValidation";
import { validateLibro } from "@/lib/validations/libro";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
} from "lucide-react";
import {
  editarLibroAction,
  getAuthorOptionsAction,
  getCategoryOptionsAction,
  getLibroByIdAction,
} from "../libros/action";
import { createCategoryAction } from "../categorias/action";
import type { LibroActionResponse } from "@/lib/types/libro";

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

const ESTADO_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "usado", label: "Usado" },
];

const IDIOMA_OPTIONS = [
  { value: "Español", label: "Español" },
  { value: "Inglés", label: "Inglés" },
  { value: "Francés", label: "Francés" },
  { value: "Alemán", label: "Alemán" },
  { value: "Portugués", label: "Portugués" },
  { value: "Italiano", label: "Italiano" },
  { value: "Otro", label: "Otro" },
];



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

  const { values, errors, handleChange, handleBlur, setValues, setErrors } =
    useValidation<LibroFormValues>(INITIAL_VALUES, validateForm, {
      onFieldChange: () => setAlertState(null),
    });

  // ─── Carga datos ───────────────────────────────────────────────

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
          loadAuthorOptions(),
          loadCategoryOptions(),
        ]);

        if (!libro) {
          setNotFound(true);
          return;
        }

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
      } catch (err) {
        console.error("Error cargando libro:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAll();
  }, [libroId, loadAuthorOptions, loadCategoryOptions, setValues]);

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

      const response = await editarLibroAction(libroId, formData);
      setAlertState(response);

      if (response.success) {
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

  const handleAuthorCreated = async () => {
    await loadAuthorOptions();
  };

  const handleCategoryCreated = async () => {
    await loadCategoryOptions();
  };

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
          <Button
            onClick={() => router.push("/panel-admin/libros")}
            className="w-auto px-6 py-2 text-sm">
            Volver a libros
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <button
        type="button"
        onClick={() => router.push("/panel-admin/libros")}
        className="inline-flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition-colors mb-6 cursor-pointer group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver a libros
      </button>

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
          variant={alertState.success ? "success" : "error"}
          className="mb-6 !relative !left-0 !translate-x-0">
          {alertState.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
        {/* Información básica */}
        <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
            Información Básica
          </h2>

          <Input
            id="edit-libro-titulo"
            label="Título"
            placeholder="Ej: Cien años de soledad"
            value={values.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            onBlur={() => handleBlur("titulo")}
            error={errors.titulo}
            required
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="edit-libro-isbn"
              label="ISBN"
              placeholder="Ej: 9780060883287"
              value={values.isbn}
              onChange={(e) => handleChange("isbn", e.target.value)}
              onBlur={() => handleBlur("isbn")}
              error={errors.isbn}
              required
              disabled={isSubmitting}
            />

            <Select
              id="edit-libro-idioma"
              label="Idioma"
              options={IDIOMA_OPTIONS}
              value={values.idioma}
              onChange={(e) => handleChange("idioma", e.target.value)}
              onBlur={() => handleBlur("idioma")}
              error={errors.idioma}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="edit-libro-sinopsis"
              className="text-sm font-semibold text-brand-primary tracking-wide flex items-center gap-1 mb-1.5">
              Sinopsis
              {!isSubmitting && <span className="text-brand-primary ml-1">*</span>}
            </label>
            <textarea
              id="edit-libro-sinopsis"
              rows={4}
              placeholder="Describe brevemente el contenido del libro..."
              value={values.sinopsis}
              onChange={(e) => handleChange("sinopsis", e.target.value)}
              onBlur={() => handleBlur("sinopsis")}
              disabled={isSubmitting}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 shadow-sm
                bg-brand-bg text-brand-text resize-none
                placeholder:text-brand-accent
                focus:outline-none focus:ring-2
                ${
                  errors.sinopsis
                    ? "border-red-500 focus:ring-red-400/60 focus:border-red-500"
                    : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary"
                }`}
            />
            {errors.sinopsis && (
              <p className="text-xs text-red-500 mt-0.5">{errors.sinopsis}</p>
            )}
          </div>
        </section>

        {/* Detalles */}
        <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
            Detalles de Publicación
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="edit-libro-paginas"
              label="Páginas"
              type="number"
              min={1}
              placeholder="Ej: 417"
              value={values.paginas}
              onChange={(e) => handleChange("paginas", e.target.value)}
              onBlur={() => handleBlur("paginas")}
              error={errors.paginas}
              required
              disabled={isSubmitting}
            />

            <Input
              id="edit-libro-precio"
              label="Precio"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ej: 45000"
              value={values.precio}
              onChange={(e) => handleChange("precio", e.target.value)}
              onBlur={() => handleBlur("precio")}
              error={errors.precio}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="edit-libro-estado"
              label="Condición"
              options={ESTADO_OPTIONS}
              value={values.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              onBlur={() => handleBlur("estado")}
              error={errors.estado}
              required
              disabled={isSubmitting}
            />

            <Input
              id="edit-libro-fecha-publicacion"
              label="Fecha de publicación"
              type="date"
              value={values.fecha_publicacion}
              onChange={(e) => handleChange("fecha_publicacion", e.target.value)}
              onBlur={() => handleBlur("fecha_publicacion")}
              error={errors.fecha_publicacion}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            id="edit-libro-editorial"
            label="Editorial"
            placeholder="Ej: Editorial Sudamericana"
            value={values.editorial}
            onChange={(e) => handleChange("editorial", e.target.value)}
            onBlur={() => handleBlur("editorial")}
            error={errors.editorial}
            required
            disabled={isSubmitting}
          />
        </section>

        {/* Clasificación */}
        <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
            Clasificación
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SearchableSelect
                id="edit-libro-autor"
                label="Autor"
                value={values.id_autor}
                options={authorOptions}
                onChange={(val) => handleChange("id_autor", val)}
                onBlur={() => handleBlur("id_autor")}
                error={errors.id_autor}
                required
                disabled={isSubmitting}
                placeholder="Buscar autor..."
                noOptionsText="No se encontraron autores."
              />
              <button
                type="button"
                onClick={() => setIsAuthorModalOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-bold text-brand-bg bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md cursor-pointer">
                <Plus className="w-4 h-4" />
                Añadir nuevo autor
              </button>
            </div>

            <div className="space-y-2">
              <SearchableSelect
                id="edit-libro-categoria"
                label="Categoría"
                value={values.id_categoria}
                options={categoryOptions}
                onChange={(val) => handleChange("id_categoria", val)}
                onBlur={() => handleBlur("id_categoria")}
                error={errors.id_categoria}
                required
                disabled={isSubmitting}
                placeholder="Buscar categoría..."
                noOptionsText="No se encontraron categorías."
              />
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-bold text-brand-bg bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md cursor-pointer">
                <Plus className="w-4 h-4" />
                Añadir nueva categoría
              </button>
            </div>
          </div>
        </section>

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
