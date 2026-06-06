"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { SearchableSelectOption } from "@/components/ui/SearchableSelect";
import ModeloRASection from "@/components/ra/ModeloRASection";
import { Plus } from "lucide-react";

// ─── Shared constants ──────────────────────────────────────────────

export const ESTADO_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "usado", label: "Usado" },
];

export const IDIOMA_OPTIONS = [
  { value: "Español", label: "Español" },
  { value: "Inglés", label: "Inglés" },
  { value: "Francés", label: "Francés" },
  { value: "Alemán", label: "Alemán" },
  { value: "Portugués", label: "Portugués" },
  { value: "Italiano", label: "Italiano" },
  { value: "Otro", label: "Otro" },
];

// ─── Interfaces ────────────────────────────────────────────────────

export interface LibroFormValues extends Record<string, unknown> {
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
  [key: string]: unknown;
}

export interface SectionProps {
  values: LibroFormValues;
  errors: Record<string, string>;
  handleChange: (field: string, value: string) => void;
  handleBlur: (field: string) => void;
  isSubmitting: boolean;
  idPrefix?: string;
}

export interface ClassificationSectionProps extends SectionProps {
  authorOptions: SearchableSelectOption[];
  categoryOptions: SearchableSelectOption[];
  onOpenAuthorModal: () => void;
  onOpenCategoryModal: () => void;
}

export interface RASectionProps {
  paginas: number;
  disabled: boolean;
  errors: Record<string, string>;
  dimensiones: { ancho: string; alto: string };
  onDimensionesChange: (field: "ancho" | "alto", value: string) => void;
  existingTexturas?: { portada: string | null; contraportada: string | null; lomo: string | null };
  onTexturasChange: (files: Partial<Record<"portada" | "contraportada" | "lomo", File>>) => void;
}

// ─── Section components ────────────────────────────────────────────

export function LibroBasicInfoSection({ values, errors, handleChange, handleBlur, isSubmitting, idPrefix = "" }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
        Información Básica
      </h2>

      <Input
        id={`${idPrefix}libro-titulo`}
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
          id={`${idPrefix}libro-isbn`}
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
          id={`${idPrefix}libro-idioma`}
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
          htmlFor={`${idPrefix}libro-sinopsis`}
          className="text-sm font-semibold text-brand-primary tracking-wide flex items-center gap-1 mb-1.5">
          Sinopsis
          {!isSubmitting && <span className="text-brand-primary ml-1">*</span>}
        </label>
        <textarea
          id={`${idPrefix}libro-sinopsis`}
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
  );
}

export function LibroDetailsSection({ values, errors, handleChange, handleBlur, isSubmitting, idPrefix = "" }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
        Detalles de Publicación
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id={`${idPrefix}libro-paginas`}
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
          id={`${idPrefix}libro-precio`}
          label="Precio"
          type="number"
          min={0}
          step="1"
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
          id={`${idPrefix}libro-estado`}
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
          id={`${idPrefix}libro-fecha-publicacion`}
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
        id={`${idPrefix}libro-editorial`}
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
  );
}

export function LibroClassificationSection({
  values, errors, handleChange, handleBlur, isSubmitting,
  authorOptions, categoryOptions, onOpenAuthorModal, onOpenCategoryModal,
  idPrefix = "",
}: ClassificationSectionProps) {
  return (
    <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight border-b border-brand-accent/10 pb-3">
        Clasificación
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SearchableSelect
            id={`${idPrefix}libro-autor`}
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
            onClick={onOpenAuthorModal}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-bold text-brand-bg bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" />
            Añadir nuevo autor
          </button>
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id={`${idPrefix}libro-categoria`}
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
            onClick={onOpenCategoryModal}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-bold text-brand-bg bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" />
            Añadir nueva categoría
          </button>
        </div>
      </div>
    </section>
  );
}

export function LibroRASection(props: RASectionProps) {
  return <ModeloRASection {...props} />;
}
