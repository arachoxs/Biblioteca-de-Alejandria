import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const hasAdminCredentials = ADMIN_EMAIL !== "" && ADMIN_PASSWORD !== "";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await expect(
    page.getByRole("heading", { name: "Iniciar Sesión" }),
  ).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Ingresar$/ }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function openCategoriasPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/categorias`);
  await expect(page).toHaveURL(/\/panel-admin\/categorias(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Gestión de Categorías" }),
  ).toBeVisible();
}

test.describe("Panel admin - Gestión de Categorías", () => {
  test.skip(
    !hasAdminCredentials,
    "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar estos escenarios.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openCategoriasPage(page);
  });

  test("renderiza la página y permite abrir el modal de creación", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Nueva Categoría" }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Buscar categorías por nombre..."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Crear Categoría" }),
    ).toBeDisabled();
  });

  test("valida nombre vacío", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();

    await page.locator("#category-name").fill("");
    await page.locator("#category-name").blur();

    await expect(
      page.getByText(/el nombre de la categoría es obligatorio/i),
    ).toBeVisible();
  });

  test("valida nombre duplicado exacto", async ({ page }) => {
    const uniqueName = `Categoría Duplicada ${Date.now()}`;

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await page.locator("#category-name").fill(uniqueName);
    await page.getByRole("button", { name: "Crear Categoría" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await page.locator("#category-name").fill(uniqueName);
    await page.getByRole("button", { name: "Crear Categoría" }).click();
    await page.waitForTimeout(500);

    await expect(
      page.getByText(/ya existe una categoría con ese nombre/i),
    ).toBeVisible();
  });

  test("valida nombre duplicado case-insensitive", async ({ page }) => {
    const uniqueName = `Categoría Case Test ${Date.now()}`;

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await page.locator("#category-name").fill(uniqueName);
    await page.getByRole("button", { name: "Crear Categoría" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await page.locator("#category-name").fill(uniqueName.toUpperCase());
    await page.getByRole("button", { name: "Crear Categoría" }).click();
    await page.waitForTimeout(500);

    await expect(
      page.getByText(/ya existe una categoría con ese nombre/i),
    ).toBeVisible();
  });

  test("happy path: crear categoría con datos válidos", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();

    const uniqueName = `Categoría QA ${Date.now()}`;
    await page.locator("#category-name").fill(uniqueName);
    await page
      .locator("#category-description")
      .fill("Descripción de prueba para categoría QA");

    const createButton = page.getByRole("button", { name: "Crear Categoría" });
    await expect(createButton).toBeEnabled();

    await createButton.click();
    await page.waitForTimeout(800);

    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).not.toBeVisible();
  });

  test("resetea el formulario al cerrar el modal", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();

    await page.locator("#category-name").fill("Categoría Temporal");
    await page.locator("#category-description").fill("Descripción temporal");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await expect(page.locator("#category-name")).toHaveValue("");
    await expect(page.locator("#category-description")).toHaveValue("");
  });

  test("buscar categorías por nombre", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Buscar categorías por nombre...",
    );
    await searchInput.fill("inexistente-qa-test");
    await page.waitForTimeout(800);

    await expect(page.getByText(/no se encontraron categorías/i)).toBeVisible();
  });

  test("verificar paginación presente", async ({ page }) => {
    await page.waitForTimeout(500);

    const pagination = page.locator("nav[aria-label='Paginación']");
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (!hasPagination) {
      await expect(
        page.getByText(/1 de \d+/i).or(page.getByText(/sin resultados/i)),
      ).toBeVisible();
    }
  });
});
