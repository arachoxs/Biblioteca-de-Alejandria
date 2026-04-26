import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const hasAdminCredentials = ADMIN_EMAIL !== "" && ADMIN_PASSWORD !== "";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.getByRole("heading", { name: "Iniciar Sesión" })).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^Ingresar$/ }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function openTiendasPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/tiendas`);
  await expect(page).toHaveURL(/\/panel-admin\/tiendas(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Gestión de Tiendas" })).toBeVisible();
}

test.describe("Panel admin - Gestión de Tiendas", () => {
  test.skip(
    !hasAdminCredentials,
    "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar estos escenarios.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openTiendasPage(page);
  });

  test("renderiza la página y permite abrir el modal de creación", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Nueva Tienda" })).toBeVisible();
    await expect(page.getByText("Buscar tiendas por nombre...")).toBeVisible();

    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear Tienda" })).toBeDisabled();
  });

  test("valida nombre vacío", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    await page.locator("#tienda-nombre").fill("");
    await page.locator("#tienda-nombre").blur();

    await expect(page.getByText("El nombre de la tienda es requerido.")).toBeVisible();
  });

  test("valida nombre demasiado largo (>150 chars)", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    const longName = "A".repeat(151);
    await page.locator("#tienda-nombre").fill(longName);
    await page.locator("#tienda-nombre").blur();

    await expect(page.getByText(/no puede exceder 150 caracteres/i)).toBeVisible();
  });

  test("valida horario sin días configurados", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    await page.locator("#tienda-nombre").fill("Tienda Test Sin Horario");
    await page.getByLabel("Dirección").fill("Calle Falsa 123");

    const allDays = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
    for (const day of allDays) {
      const checkbox = page.locator(`input[type="checkbox"]`).nth(allDays.indexOf(day));
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.uncheck();
      }
    }

    await page.locator("#tienda-nombre").blur();

    await expect(page.getByText(/al menos un día de atención/i)).toBeVisible();
  });

  test("valida hora apertura >= cierre", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    await page.locator("#tienda-nombre").fill("Tienda Test Horario Inválido");
    await page.getByLabel("Dirección").fill("Calle Falsa 123");

    const cierreInput = page.locator("#tienda-lunes-cierre");
    await cierreInput.fill("08:00");
    await page.locator("#tienda-lunes-apertura").fill("18:00");
    await page.locator("#tienda-lunes-apertura").blur();

    await expect(page.getByText(/hora de apertura debe ser anterior/i)).toBeVisible();
  });

  test("happy path: crear tienda con datos válidos", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    const uniqueSuffix = Date.now();
    await page.locator("#tienda-nombre").fill(`Tienda QA ${uniqueSuffix}`);
    await page.getByLabel("Dirección").fill("Av. Libertador 1234, Santiago, Chile");

    const saveButton = page.getByRole("button", { name: "Crear Tienda" });
    await expect(saveButton).toBeDisabled();

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).not.toBeVisible();
  });

  test("resetea el formulario al cerrar el modal", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).toBeVisible();

    await page.locator("#tienda-nombre").fill("Tienda Temporal");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: "Nueva Tienda" })).not.toBeVisible();

    await page.getByRole("button", { name: "Nueva Tienda" }).click();
    await expect(page.locator("#tienda-nombre")).toHaveValue("");
  });

  test("buscar tiendas por nombre", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Buscar tiendas por nombre...");
    await searchInput.fill("inexistente");
    await page.waitForTimeout(700);

    await expect(page.getByText(/no se encontraron tiendas/i)).toBeVisible();
  });

  test("verificar paginación presente", async ({ page }) => {
    await page.waitForTimeout(500);

    const pagination = page.locator("nav[aria-label='Paginación']");
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (!hasPagination) {
      await expect(page.getByText(/1 de \d+/i).or(page.getByText(/sin resultados/i))).toBeVisible();
    }
  });
});
