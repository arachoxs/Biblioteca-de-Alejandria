"use server";

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  searchCategoriesByName,
  updateCategory,
} from "@/services/categoryService";
import { validateCategory } from "@/lib/validations/category";
import {
  isValidPositiveInteger,
  sanitizeNullableText,
  sanitizeText,
  toSafePositiveInt,
} from "@/lib/validations/rules";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryWithBookCount,
} from "@/lib/types/category";
import type { ActionResponse, DataResponse, Paginated } from "@/lib/types/common";

/**
 * Server Action: obtiene categorías activas paginadas.
 */
export async function getCategoriesAction(
  page: number = 1,
  pageSize: number = 10,
): Promise<DataResponse<Paginated<CategoryWithBookCount>>> {
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 10);
  return await fetchCategories(safePage, safePageSize);
}

/**
 * Server Action: busca categorías activas por nombre.
 */
export async function searchCategoriesAction(
  searchTerm: string,
): Promise<DataResponse<CategoryWithBookCount[]>> {
  const cleanTerm = sanitizeText(searchTerm);
  return await searchCategoriesByName(cleanTerm);
}

/**
 * Server Action: crea una categoría.
 */
export async function createCategoryAction(
  input: CategoryCreateInput,
): Promise<ActionResponse> {
  const sanitized: CategoryCreateInput = {
    nombre: sanitizeText(input.nombre),
    descripcion: sanitizeNullableText(input.descripcion),
  };

  const errors = validateCategory({ nombre: sanitized.nombre });

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return await createCategory(sanitized);
}

/**
 * Server Action: actualiza una categoría existente.
 */
export async function updateCategoryAction(
  categoryId: number,
  input: CategoryUpdateInput,
): Promise<ActionResponse> {
  if (!isValidPositiveInteger(categoryId)) {
    return {
      success: false,
      errors: { form: "El identificador de categoría no es válido." },
    };
  }

  const sanitized: CategoryUpdateInput = {};

  if (input.nombre !== undefined) {
    sanitized.nombre = sanitizeText(input.nombre);
  }

  if (input.descripcion !== undefined) {
    sanitized.descripcion = sanitizeNullableText(input.descripcion);
  }

  if (sanitized.nombre === undefined && sanitized.descripcion === undefined) {
    return {
      success: false,
      errors: { form: "Debes enviar al menos un campo para actualizar." },
    };
  }

  const errors = sanitized.nombre !== undefined
    ? validateCategory({ nombre: sanitized.nombre })
    : {};

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return await updateCategory(categoryId, sanitized);
}

/**
 * Server Action: elimina lógicamente una categoría.
 */
export async function deleteCategoryAction(
  categoryId: number,
): Promise<ActionResponse> {
  if (!isValidPositiveInteger(categoryId)) {
    return {
      success: false,
      errors: { form: "El identificador de categoría no es válido." },
    };
  }

  return await deleteCategory(categoryId);
}
