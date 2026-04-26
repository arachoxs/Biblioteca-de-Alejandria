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

async function openInventarioPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/inventario`);
  await expect(page).toHaveURL(/\/panel-admin\/inventario(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Gestión de Inventario" }),
  ).toBeVisible();
}

test.describe("Panel admin - Gestión de Inventario", () => {
  test.skip(
    !hasAdminCredentials,
    "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar estos escenarios.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openInventarioPage(page);
  });

  test("renderiza la página y permite abrir el modal de agregar", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Gestión de Inventario" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Agregar inventario" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();
  });

  test("valida cantidad vacía al agregar inventario", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.locator("#inventario-cantidad").fill("");
    await page.locator("#inventario-cantidad").blur();

    await expect(page.getByText(/la cantidad es obligatoria/i)).toBeVisible();
  });

  test("valida cantidad 0", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.locator("#inventario-cantidad").fill("0");
    await page.locator("#inventario-cantidad").blur();

    await expect(
      page.getByText(/la cantidad debe ser mayor a 0/i),
    ).toBeVisible();
  });

  test("valida cantidad negativa", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.locator("#inventario-cantidad").fill("-5");
    await page.locator("#inventario-cantidad").blur();

    await expect(
      page.getByText(/la cantidad debe ser mayor a 0/i),
    ).toBeVisible();
  });

  test("valida libro sin seleccionar", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.locator("#inventario-libro").fill("");
    await page.locator("#inventario-libro").blur();

    await expect(page.getByText(/Debes seleccionar un libro./i)).toBeVisible();
  });

  test("valida tienda sin seleccionar", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.locator("#inventario-tienda").fill("");
    await page.locator("#inventario-tienda").blur();

    await expect(
      page.getByText(/Debes seleccionar una tienda./i),
    ).toBeVisible();
  });

  test("filtra por tienda", async ({ page }) => {
    await page.waitForTimeout(500);

    const storeButtons = page.locator("button").filter({ hasText: /^[A-Z]/ });
    const storeCount = await storeButtons.count();

    if (storeCount > 1) {
      await storeButtons.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test("buscar por libro inexistente", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Buscar por libro, autor o ISBN...",
    );
    await searchInput.fill("libro-inexistente-qa-test-12345");
    await page.waitForTimeout(500);

    await expect(
      page
        .getByText(/No se encontró inventario/i)
        .or(page.getByText(/sin resultados/i)),
    ).toBeVisible();
  });

  test("verificar modal de detalle al hacer click en fila", async ({
    page,
  }) => {
    await page.waitForTimeout(800);

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();
      await page.waitForTimeout(300);

      const modal = page.locator("[role='dialog']");
      const isModalVisible = await modal.isVisible().catch(() => false);
      if (isModalVisible) {
        await expect(page.getByText(/detalle de inventario/i)).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
  });

  test("cerrar modal con cancel button", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar inventario" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("heading", { name: "Agregar nuevo inventario" }),
    ).not.toBeVisible();
  });
});
