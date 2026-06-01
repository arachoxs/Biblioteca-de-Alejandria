import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
  getLibrosRecomendacion,
  getLibroRecomendacionById,
  countLibrosRecomendacion,
} from "@/models/libroRecomendacionModel";
import { getCategories as getCategoriesModel } from "@/models/categoryModel";
import { getAuthors as getAuthorsModel } from "@/models/authorModel";

// ─── searchBooks ──────────────────────────────────────────────────

export const searchBooks = tool({
  description:
    "Busca libros disponibles en el catálogo. " +
    "Úsalo cuando el usuario pida recomendaciones, busque libros por título, " +
    "quiera explorar por categoría o autor. " +
    "Retorna libros con copias disponibles (> 0).",
  inputSchema: z.object({
    termino: z
      .string()
      .optional()
      .describe("Término de búsqueda (título o ISBN)"),
    categoria_id: z
      .number()
      .optional()
      .describe("ID de categoría para filtrar"),
    autor_id: z.number().optional().describe("ID de autor para filtrar"),
    idioma: z
      .string()
      .optional()
      .describe("Idioma del libro (ej: Español, Inglés)"),
    page: z.number().optional().describe("Número de página (default: 1)"),
    pageSize: z
      .number()
      .optional()
      .describe("Resultados por página (default: 20, max: 50)"),
  }),
  execute: async ({
    termino,
    categoria_id,
    autor_id,
    idioma,
    page,
    pageSize,
  }) => {
    const result = await getLibrosRecomendacion(page, pageSize, {
      termino,
      categoria_id,
      autor_id,
      idioma,
    });
    return {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      libros: result.data.map((libro) => ({
        id: libro.libro_id,
        titulo: libro.titulo,
        autor: libro.autor_nombre,
        categoria: libro.categoria_nombre,
        precio: libro.precio,
        copias_disponibles: libro.copias_disponibles,
        idioma: libro.idioma,
      })),
    };
  },
});

// ─── getBookDetail ────────────────────────────────────────────────

export const getBookDetail = tool({
  description:
    "Obtiene el detalle completo de un libro por su ID. " +
    "Úsalo cuando el usuario pregunte por un libro específico " +
    "o quiera ver sinopsis, precio, disponibilidad exacta.",
  inputSchema: z.object({
    libro_id: z.string().describe("UUID del libro"),
  }),
  execute: async ({ libro_id }) => {
    const libro = await getLibroRecomendacionById(libro_id);
    if (!libro) {
      return {
        found: false,
        message: "Libro no encontrado o sin copias disponibles.",
      };
    }
    return {
      found: true,
      libro: {
        id: libro.libro_id,
        titulo: libro.titulo,
        isbn: libro.isbn,
        sinopsis: libro.sipnosis,
        autor: libro.autor_nombre,
        nacionalidad_autor: libro.autor_nacionalidad,
        categoria: libro.categoria_nombre,
        descripcion_categoria: libro.categoria_descripcion,
        precio: libro.precio,
        idioma: libro.idioma,
        paginas: libro.paginas,
        editorial: libro.editorial,
        estado: libro.condicion_libro,
        fecha_publicacion: libro.fecha_publicacion,
        copias_disponibles: libro.copias_disponibles,
        copias_reservadas: libro.copias_reservadas,
        copias_vendidas: libro.copias_vendidas,
      },
    };
  },
});

// ─── getCategoriesList ────────────────────────────────────────────

export const getCategoriesList = tool({
  description:
    "Lista todas las categorías de libros disponibles. " +
    "Úsalo cuando el usuario quiera saber qué géneros hay " +
    "o necesites los IDs de categoría para filtrar.",
  inputSchema: z.object({
    page: z.number().optional().describe("Página (default: 1)"),
    pageSize: z
      .number()
      .optional()
      .describe("Resultados por página (default: 50)"),
  }),
  execute: async ({ page, pageSize }) => {
    const result = await getCategoriesModel({
      page: page ?? 1,
      pageSize: pageSize ?? 50,
    });
    return {
      total: result.total,
      categorias: result.data.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        cantidad_libros: cat.libro_count,
      })),
    };
  },
});

// ─── getAuthorsList ───────────────────────────────────────────────

export const getAuthorsList = tool({
  description:
    "Lista autores disponibles en el catálogo. " +
    "Úsalo cuando el usuario busque un autor específico " +
    "o quiera explorar libros por autor.",
  inputSchema: z.object({
    termino: z
      .string()
      .optional()
      .describe("Buscar por nombre o nacionalidad"),
    page: z.number().optional().describe("Página (default: 1)"),
    pageSize: z
      .number()
      .optional()
      .describe("Resultados por página (default: 50)"),
  }),
  execute: async ({ termino, page, pageSize }) => {
    const result = await getAuthorsModel(page ?? 1, pageSize ?? 50, termino);
    return {
      total: result.total,
      autores: result.data.map((autor) => ({
        id: autor.id,
        nombre: autor.nombre,
        nacionalidad: autor.nacionalidad,
        cantidad_libros: autor.libro_count,
      })),
    };
  },
});

// ─── getRelatedBooks ──────────────────────────────────────────────

export const getRelatedBooks = tool({
  description:
    "Obtiene libros relacionados: mismos de la misma categoría o del mismo autor. " +
    "Úsalo después de mostrar un libro para sugerir 'otros similares' o 'te puede interesar'.",
  inputSchema: z.object({
    libro_id: z
      .string()
      .describe("UUID del libro base para buscar relacionados"),
    tipo: z
      .enum(["categoria", "autor", "ambos"])
      .optional()
      .describe(
        "Tipo de relación: 'categoria', 'autor' o 'ambos' (default: 'ambos')",
      ),
    page: z.number().optional().describe("Página (default: 1)"),
  }),
  execute: async ({ libro_id, tipo, page }) => {
    const base = await getLibroRecomendacionById(libro_id);
    if (!base) {
      return { found: false, message: "Libro base no encontrado." };
    }

    const relations = tipo ?? "ambos";
    const results = [];

    if (relations === "categoria" || relations === "ambos") {
      const porCategoria = await getLibrosRecomendacion(page ?? 1, 5, {
        categoria_id: base.categoria_id,
      });
      results.push({
        tipo: "misma_categoria",
        categoria: base.categoria_nombre,
        libros: porCategoria.data
          .filter((l) => l.libro_id !== libro_id)
          .map((l) => ({
            id: l.libro_id,
            titulo: l.titulo,
            autor: l.autor_nombre,
            precio: l.precio,
          })),
      });
    }

    if (relations === "autor" || relations === "ambos") {
      const porAutor = await getLibrosRecomendacion(page ?? 1, 5, {
        autor_id: base.autor_id,
      });
      results.push({
        tipo: "mismo_autor",
        autor: base.autor_nombre,
        libros: porAutor.data
          .filter((l) => l.libro_id !== libro_id)
          .map((l) => ({
            id: l.libro_id,
            titulo: l.titulo,
            categoria: l.categoria_nombre,
            precio: l.precio,
          })),
      });
    }

    return { found: true, relaciones: results };
  },
});

// ─── countBooks ───────────────────────────────────────────────────

export const countBooks = tool({
  description:
    "Cuenta cuántos libros hay disponibles con ciertos filtros sin traer datos. " +
    "Úsalo para verificar disponibilidad antes de hacer recomendaciones.",
  inputSchema: z.object({
    termino: z.string().optional().describe("Término de búsqueda"),
    categoria_id: z.number().optional().describe("ID de categoría"),
    autor_id: z.number().optional().describe("ID de autor"),
    idioma: z.string().optional().describe("Idioma"),
  }),
  execute: async (filters) => {
    const count = await countLibrosRecomendacion(filters);
    return { total: count };
  },
});
