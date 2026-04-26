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

async function openLibrosPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/libros`);
  await expect(page).toHaveURL(/\/panel-admin\/libros(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Gestión de Libros" }),
  ).toBeVisible();
}

async function openRegistrarLibroPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/registrar-libro`);
  await expect(
    page.getByRole("heading", { name: "Registrar Libro" }),
  ).toBeVisible();
}

test.describe("Panel admin - Gestión de Libros", () => {
  test.skip(
    !hasAdminCredentials,
    "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar estos escenarios.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("renderiza la página de gestión de libros", async ({ page }) => {
    await openLibrosPage(page);
    await expect(
      page.getByRole("button", { name: "Registrar Libro" }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Buscar por título, ISBN, autor o editorial..."),
    ).toBeVisible();
  });

  test("valida título vacío al registrar libro", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-titulo").fill("");
    await page.locator("#libro-titulo").blur();

    await expect(page.getByText(/el título es requerido/i)).toBeVisible();
  });

  test("valida título demasiado largo (>300 chars)", async ({ page }) => {
    await openRegistrarLibroPage(page);

    const longTitle = "A".repeat(301);
    await page.locator("#libro-titulo").fill(longTitle);
    await page.locator("#libro-titulo").blur();

    await expect(
      page.getByText(/no puede exceder 300 caracteres/i),
    ).toBeVisible();
  });

  test("valida ISBN formato inválido", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-isbn").fill("abc123invalid");
    await page.locator("#libro-isbn").blur();

    await expect(page.getByText(/formato de isbn no válido/i)).toBeVisible();
  });

  test("valida ISBN vacío", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-isbn").fill("");
    await page.locator("#libro-isbn").blur();

    await expect(page.getByText(/el isbn es requerido/i)).toBeVisible();
  });

  test("valida sinopsis muy corta (<10 chars)", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-sinopsis").fill("Corta");
    await page.locator("#libro-sinopsis").blur();

    await expect(page.getByText(/mínimo 10 caracteres/i)).toBeVisible();
  });

  test("valida páginas 0", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-paginas").fill("0");
    await page.locator("#libro-paginas").blur();

    await expect(page.getByText(/mayor a 0/i)).toBeVisible();
  });

  test("valida páginas negativo", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-paginas").fill("-10");
    await page.locator("#libro-paginas").blur();

    await expect(page.getByText(/mayor a 0/i)).toBeVisible();
  });

  test("valida páginas >50000", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-paginas").fill("50001");
    await page.locator("#libro-paginas").blur();

    await expect(page.getByText(/no puede exceder 50,000/i)).toBeVisible();
  });

  test("valida precio negativo", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-precio").fill("-100");
    await page.locator("#libro-precio").blur();

    await expect(page.getByText(/mayor o igual a 0/i)).toBeVisible();
  });

  test("valida fecha futura", async ({ page }) => {
    await openRegistrarLibroPage(page);

    const futureDate = "2999-01-01";
    await page.locator("#libro-fecha-publicacion").fill(futureDate);
    await page.locator("#libro-fecha-publicacion").blur();

    await expect(page.getByText(/no puede estar en el futuro/i)).toBeVisible();
  });

  test("valida estado inválido", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-estado").selectOption("");
    await page.locator("#libro-estado").blur();

    await expect(page.getByText(/debe ser 'nuevo' o 'usado'/i)).toBeVisible();
  });

  test("valida editorial vacía", async ({ page }) => {
    await openRegistrarLibroPage(page);

    await page.locator("#libro-editorial").fill("");
    await page.locator("#libro-editorial").blur();

    await expect(page.getByText(/la editorial es requerida/i)).toBeVisible();
  });

  test("buscar libro inexistente", async ({ page }) => {
    await openLibrosPage(page);

    const searchInput = page.getByPlaceholder(
      "Buscar por título, ISBN, autor o editorial...",
    );
    await searchInput.fill("libro-inexistente-qa-12345");
    await page.waitForTimeout(500);

    await expect(page.getByText(/no se encontraron/i)).toBeVisible();
  });

  test("verificar paginación presente", async ({ page }) => {
    await openLibrosPage(page);
    await page.waitForTimeout(500);

    const pagination = page.locator("nav[aria-label='Paginación']");
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (!hasPagination) {
      await expect(
        page.getByText(/1 de \d+/i).or(page.getByText(/sin resultados/i)),
      ).toBeVisible();
    }
  });

  test("navegar a registro de libro y volver", async ({ page }) => {
    await openLibrosPage(page);

    await page.getByRole("button", { name: "Registrar Libro" }).click();
    await expect(page).toHaveURL(/\/panel-admin\/registrar-libro/);
    await expect(
      page.getByRole("heading", { name: "Registrar Libro" }),
    ).toBeVisible();

    await page.getByText("Volver a libros").click();
    await expect(page).toHaveURL(/\/panel-admin\/libros/);
  });
});
