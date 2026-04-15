import {
  createCategory as createCategoryModel,
  getCategories as getCategoriesModel,
  getActiveCategoryByExactName,
  getActiveCategoryByExactNameExcludingId,
  getActiveCategoryById,
  hasActiveBooksForCategory,
  searchCategoriesByName as searchCategoriesByNameModel,
  softDeleteCategoryById,
  updateCategoryById,
} from "@/models/categoryModel";
import type {
  CategoryCreateInput,
  CategoryWithBookCount,
  CategoryUpdateInput,
  CategoryListResponse,
  CategorySearchResponse,
  CategoryActionResponse,
} from "@/lib/types/category";
import type {
  DataResponse,
} from "@/lib/types/common";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { sanitizeNullableText, sanitizeText } from "@/lib/validations/rules";

function normalizeCategoryName(name: string): string {
  return sanitizeText(name);
}

function normalizeDescription(
  description: string | null | undefined,
): string | null {
  return sanitizeNullableText(description);
}

function isSameName(left: string, right: string): boolean {
  return (
    normalizeCategoryName(left).toLocaleLowerCase() ===
    normalizeCategoryName(right).toLocaleLowerCase()
  );
}

/**
 * Obtiene categorías activas paginadas para el panel administrativo.
 */
export async function fetchCategories(
  page: number = 1,
  pageSize: number = 10,
): Promise<CategoryListResponse> {
  try {
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return roleCheck;

    const data = await getCategoriesModel(page, pageSize);
    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error inesperado al obtener categorías:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudieron cargar las categorías.",
    };
  }
}

/**
 * Crea una categoría validando duplicados por nombre.
 */
export async function createCategory(
  input: CategoryCreateInput,
): Promise<CategoryActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const normalizedName = normalizeCategoryName(input.nombre ?? "");
    if (!normalizedName) {
      return {
        success: false,
        errors: { nombre: "El nombre de la categoría es obligatorio." },
      };
    }

    const duplicatedCategory =
      await getActiveCategoryByExactName(normalizedName);
    if (duplicatedCategory) {
      return {
        success: false,
        errors: { nombre: "Ya existe una categoría con ese nombre." },
      };
    }

    const result = await createCategoryModel({
      nombre: normalizedName,
      descripcion: normalizeDescription(input.descripcion),
    });

    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo crear la categoría." },
        message: "No se pudo crear la categoría.",
      };
    }

    return {
      success: true,
      message: "Categoría creada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al crear categoría:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo crear la categoría.",
    };
  }
}

/**
 * Edita una categoría activa y valida nombre duplicado cuando cambia.
 */
export async function updateCategory(
  categoryId: number,
  input: CategoryUpdateInput,
): Promise<CategoryActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const currentCategory = await getActiveCategoryById(categoryId);
    if (!currentCategory) {
      return {
        success: false,
        errors: { form: "La categoría no existe o ya fue eliminada." },
      };
    }

    const hasName = input.nombre !== undefined;
    const hasDescription = input.descripcion !== undefined;

    if (!hasName && !hasDescription) {
      return {
        success: false,
        errors: { form: "Debes enviar al menos un campo para actualizar." },
      };
    }

    const payload: CategoryUpdateInput = {};

    if (hasName) {
      const normalizedName = normalizeCategoryName(input.nombre ?? "");

      if (!normalizedName) {
        return {
          success: false,
          errors: { nombre: "El nombre de la categoría es obligatorio." },
        };
      }

      if (!isSameName(normalizedName, currentCategory.nombre)) {
        const duplicatedCategory =
          await getActiveCategoryByExactNameExcludingId(
            normalizedName,
            categoryId,
          );

        if (duplicatedCategory) {
          return {
            success: false,
            errors: { nombre: "Ya existe una categoría con ese nombre." },
          };
        }
      }

      payload.nombre = normalizedName;
    }

    if (hasDescription) {
      payload.descripcion = normalizeDescription(input.descripcion);
    }

    const result = await updateCategoryById(categoryId, payload);
    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo actualizar la categoría." },
        message: "No se pudo actualizar la categoría.",
      };
    }

    return {
      success: true,
      message: "Categoría actualizada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al actualizar categoría:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo actualizar la categoría.",
    };
  }
}

/**
 * Elimina lógicamente una categoría activa si no tiene libros asociados.
 */
export async function deleteCategory(
  categoryId: number,
): Promise<CategoryActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const currentCategory = await getActiveCategoryById(categoryId);
    if (!currentCategory) {
      return {
        success: false,
        errors: { form: "La categoría no existe o ya fue eliminada." },
      };
    }

    const hasLinkedBooks = await hasActiveBooksForCategory(categoryId);
    if (hasLinkedBooks) {
      return {
        success: false,
        errors: {
          form: "No se puede eliminar la categoría porque tiene libros asociados.",
        },
      };
    }

    const result = await softDeleteCategoryById(categoryId);
    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo eliminar la categoría." },
        message: "No se pudo eliminar la categoría.",
      };
    }

    return {
      success: true,
      message: "Categoría eliminada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al eliminar categoría:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo eliminar la categoría.",
    };
  }
}

/**
 * Busca categorías activas por nombre.
 */
export async function searchCategoriesByName(
  searchTerm: string,
  limit: number = 20,
): Promise<CategorySearchResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const normalizedSearchTerm = normalizeCategoryName(searchTerm ?? "");
    if (!normalizedSearchTerm) {
      return {
        success: false,
        errors: { search: "El término de búsqueda no puede estar vacío." },
        message: "Por favor ingresa un término de búsqueda válido.",
      };
    }

    const data = await searchCategoriesByNameModel(normalizedSearchTerm, limit);
    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error inesperado al buscar categorías:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo realizar la búsqueda de categorías.",
    };
  }
}
