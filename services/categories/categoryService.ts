import {
  createCategory as createCategoryModel,
  getCategories as getCategoriesModel,
  getActiveCategoryByExactName,
  getActiveCategoryByExactNameExcludingId,
  getActiveCategoryById,
  hasActiveBooksForCategory,
  softDeleteCategoryById,
  updateCategoryById,
} from "@/models/categoryModel";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryListResponse,
  CategoryActionResponse,
} from "@/lib/types/category";
import type { ActionResponse } from "@/lib/types/common";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { sanitizeNullableText, sanitizeText } from "@/lib/validations/rules";
import { getErrorMessage } from "@/lib/services/errors";

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

async function validateAndBuildNameUpdate(
  newName: string | undefined,
  currentName: string,
  categoryId: number,
  payload: CategoryUpdateInput,
): Promise<ActionResponse | null> {
  if (newName === undefined) return null;

  const normalizedName = normalizeCategoryName(newName);

  if (isSameName(normalizedName, currentName)) return null;

  const duplicatedCategory = await getActiveCategoryByExactNameExcludingId(
    normalizedName,
    categoryId,
  );

  if (duplicatedCategory) {
    return {
      success: false,
      errors: { nombre: "Ya existe una categoría con ese nombre." },
      message: "Ya existe una categoría con ese nombre.",
    };
  }

  payload.nombre = normalizedName;
  return null;
}

/**
 * Obtiene categorías activas paginadas para el panel administrativo.
 */
export async function fetchCategories(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<CategoryListResponse> {
  try {
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return roleCheck;

    const normalizedSearch = searchTerm ? normalizeCategoryName(searchTerm) : "";
    const data = await getCategoriesModel(
      page,
      pageSize,
      normalizedSearch || undefined,
    );
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

    const duplicatedCategory =
      await getActiveCategoryByExactName(normalizedName);
    if (duplicatedCategory) {
      return {
        success: false,
        errors: { nombre: "Ya existe una categoría con ese nombre." },
        message: "Ya existe una categoría con ese nombre.",
      };
    }

    let createdId: number;
    try {
      createdId = await createCategoryModel({
        nombre: normalizedName,
        descripcion: normalizeDescription(input.descripcion),
      });
    } catch (error) {
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: "No se pudo crear la categoría.",
      };
    }

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.CREAR,
        description: `Se creó la categoría "${normalizedName}".`,
        entity: {
          id: String(createdId),
          entity_type: "categoría",
          display_name: normalizedName,
        },
      });
    }

    return {
      success: true,
      message: "Categoría creada exitosamente.",
      id: createdId,
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
        message: "La categoría no existe o ya fue eliminada.",
      };
    }

    const hasName = input.nombre !== undefined;
    const hasDescription = input.descripcion !== undefined;

    const payload: CategoryUpdateInput = {};

    if (hasName) {
      const nameValidationResult = await validateAndBuildNameUpdate(
        input.nombre,
        currentCategory.nombre,
        categoryId,
        payload,
      );
      if (nameValidationResult !== null && !nameValidationResult.success) {
        return nameValidationResult;
      }
    }

    if (hasDescription) {
      payload.descripcion = normalizeDescription(input.descripcion);
    }

    try {
      await updateCategoryById(categoryId, payload);
    } catch (error) {
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: "No se pudo actualizar la categoría.",
      };
    }

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.MODIFICAR,
        description: `Se actualizó la categoría "${payload.nombre ?? currentCategory.nombre}".`,
        entity: {
          id: String(categoryId),
          entity_type: "categoría",
          display_name: payload.nombre ?? currentCategory.nombre,
        },
      });
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
        message: "La categoría no existe o ya fue eliminada.",
      };
    }

    const hasLinkedBooks = await hasActiveBooksForCategory(categoryId);
    if (hasLinkedBooks) {
      return {
        success: false,
        errors: {
          form: "No se puede eliminar la categoría porque tiene libros asociados.",
        },
        message:
          "No se puede eliminar la categoría porque tiene libros asociados.",
      };
    }

    try {
      await softDeleteCategoryById(categoryId);
    } catch (error) {
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: "No se pudo eliminar la categoría.",
      };
    }

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.ELIMINAR,
        description: `Se eliminó la categoría "${currentCategory.nombre}".`,
        entity: {
          id: String(categoryId),
          entity_type: "categoría",
          display_name: currentCategory.nombre,
        },
      });
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
