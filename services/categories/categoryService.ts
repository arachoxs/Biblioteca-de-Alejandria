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
  CategoryId,
  CategoryName,
  CategoryUpdateInput,
  CategoryListResponse,
  CategoryActionResponse,
  PaginationParams,
} from "@/lib/types/category";
import type { ActionResponse } from "@/lib/types/common";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { sanitizeNullableText, sanitizeText } from "@/lib/validations/rules";
import { getErrorMessage } from "@/lib/services/errors";
import { asCategoryId, asCategoryName } from "@/lib/types/category";

function normalizeCategoryName(name: string): string {
  return sanitizeText(name);
}

function normalizeDescription(
  description: string | null | undefined,
): string | null {
  return sanitizeNullableText(description);
}

type PreMutationValidator = () => Promise<ActionResponse | null>;
type MutationFn = (
  currentCategory: NonNullable<Awaited<ReturnType<typeof getActiveCategoryById>>>
) => Promise<ActionResponse | void>;
type AuditDescriptionBuilder = (
  category: NonNullable<Awaited<ReturnType<typeof getActiveCategoryById>>>
) => string;

type CategoryMutationContext = {
  preMutationValidator: PreMutationValidator | null;
  mutation: MutationFn;
  messages: {
    errorMessageOnFailure: string;
    successMessage: string;
  };
};

type CategoryAuditContext = {
  buildAuditDescription: AuditDescriptionBuilder;
  auditAction: AccionAdministrador;
};

async function executeAdminCategoryMutation(
  categoryId: CategoryId,
  context: CategoryMutationContext,
  audit: CategoryAuditContext,
): Promise<CategoryActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const currentCategory = await getActiveCategoryById(categoryId);
  if (!currentCategory) {
    return {
      success: false,
      errors: { form: "La categoría no existe o ya fue eliminada." },
      message: "La categoría no existe o ya fue eliminada.",
    };
  }

  if (context.preMutationValidator) {
    const validationResult = await context.preMutationValidator();
    if (validationResult !== null && !validationResult.success) {
      return validationResult;
    }
  }

  const mutationResult = await context.mutation(currentCategory);
  if (mutationResult !== undefined) {
    return mutationResult as ActionResponse;
  }

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: audit.auditAction,
      description: audit.buildAuditDescription(currentCategory),
      entity: {
        id: String(categoryId),
        entity_type: "categoría",
        display_name: currentCategory.nombre,
      },
    });
  }

  return { success: true, message: context.messages.successMessage };
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
  categoryId: CategoryId,
  payload: CategoryUpdateInput,
): Promise<ActionResponse | null> {
  if (newName === undefined) return null;

  const normalizedName = normalizeCategoryName(newName);

  if (isSameName(normalizedName, currentName)) return null;

  const duplicatedCategory = await getActiveCategoryByExactNameExcludingId(
    asCategoryName(normalizedName),
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
  params: PaginationParams,
): Promise<CategoryListResponse> {
  try {
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return roleCheck;

    const data = await getCategoriesModel({
      page: params.page,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm ? normalizeCategoryName(params.searchTerm) : undefined,
    });
    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error inesperado al obtener categorías:", error);
    const errorMessage = getErrorMessage(error);
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
      await getActiveCategoryByExactName(asCategoryName(normalizedName));
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
    const errorMessage = getErrorMessage(error);
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
  categoryId: CategoryId,
  input: CategoryUpdateInput,
): Promise<CategoryActionResponse> {
  const hasName = input.nombre !== undefined;
  const hasDescription = input.descripcion !== undefined;

  const payload: CategoryUpdateInput = {};

  const mutation: MutationFn = async (currentCategory) => {
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

    await updateCategoryById(categoryId, payload);
  };

  const buildAuditDescription: AuditDescriptionBuilder = (category) =>
    `Se actualizó la categoría "${payload.nombre ?? category.nombre}".`;

  return executeAdminCategoryMutation(
    categoryId,
    {
      preMutationValidator: null,
      mutation,
      messages: {
        errorMessageOnFailure: "No se pudo actualizar la categoría.",
        successMessage: "Categoría actualizada exitosamente.",
      },
    },
    { buildAuditDescription, auditAction: AccionAdministrador.MODIFICAR },
  );
}

/**
 * Elimina lógicamente una categoría activa si no tiene libros asociados.
 */
export async function deleteCategory(
  categoryId: CategoryId,
): Promise<CategoryActionResponse> {
  const preMutationValidator: PreMutationValidator = async () => {
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
    return null;
  };

  const mutation: MutationFn = async () => {
    await softDeleteCategoryById(categoryId);
  };

  const buildAuditDescription: AuditDescriptionBuilder = (category) =>
    `Se eliminó la categoría "${category.nombre}".`;

  return executeAdminCategoryMutation(
    categoryId,
    {
      preMutationValidator,
      mutation,
      messages: {
        errorMessageOnFailure: "No se pudo eliminar la categoría.",
        successMessage: "Categoría eliminada exitosamente.",
      },
    },
    { buildAuditDescription, auditAction: AccionAdministrador.ELIMINAR },
  );
}
