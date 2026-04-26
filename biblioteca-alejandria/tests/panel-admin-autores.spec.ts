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

async function openAutoresPage(page: Page) {
  await page.goto(`${BASE_URL}/panel-admin/autores`);
  await expect(page).toHaveURL(/\/panel-admin\/autores(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Gestión de Autores" }),
  ).toBeVisible();
}

test.describe("Panel admin - Gestión de autores", () => {
  test.skip(
    !hasAdminCredentials,
    "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar estos escenarios.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openAutoresPage(page);
  });

  test("renderiza la página y permite abrir el modal de creación", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Nuevo Autor" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", {
        name: "Buscar por nombre o nacionalidad...",
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Nuevo Autor" }).click();

    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Crear Autor" }),
    ).toBeDisabled();
  });

  test("valida fecha futura y habilita envío con datos válidos", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();

    await page.getByLabel("Nombre completo").fill("Autora QA");

    // FIX: Usamos getByRole('combobox') para evitar conflicto con el buscador
    await page
      .getByRole("combobox", { name: /nacionalidad/i })
      .selectOption("Chile");

    await page.getByLabel("Fecha de nacimiento").fill("2999-01-01");
    await page.getByLabel("Fecha de nacimiento").blur();

    await expect(
      page.getByText("La fecha de nacimiento no puede ser en el futuro."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Crear Autor" }),
    ).toBeDisabled();

    await page.getByLabel("Fecha de nacimiento").fill("1980-05-07");
    await page.getByLabel("Fecha de nacimiento").blur();

    await expect(
      page.getByRole("button", { name: "Crear Autor" }),
    ).toBeEnabled();
  });

  test("resetea el formulario al cerrar el modal", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();

    await page.getByLabel("Nombre completo").fill("Autor Temporal");

    // FIX: Usamos getByRole('combobox') para evitar conflicto con el buscador
    await page
      .getByRole("combobox", { name: /nacionalidad/i })
      .selectOption("Colombia");

    await page.getByLabel("Fecha de nacimiento").fill("1977-08-17");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Nuevo Autor" }).click();

    await expect(page.getByLabel("Nombre completo")).toHaveValue("");

    // FIX: Verificamos el valor usando el rol específico
    await expect(
      page.getByRole("combobox", { name: /nacionalidad/i }),
    ).toHaveValue("");

    await expect(page.getByLabel("Fecha de nacimiento")).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "Crear Autor" }),
    ).toBeDisabled();
  });

  test("valida nombre vacío", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    await page.getByLabel("Nombre completo").fill("");
    await page.getByLabel("Nombre completo").blur();

    await expect(page.getByText(/Nombre es obligatorio/i)).toBeVisible();
  });

  test("valida nombre demasiado largo (>200 chars)", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    const longName = "A".repeat(201);
    await page.getByLabel("Nombre completo").fill(longName);
    await page.getByLabel("Nombre completo").blur();

    await expect(
      page.getByText(/no puede exceder 200 caracteres/i),
    ).toBeVisible();
  });

  test("valida nacionalidad vacía", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    await page.getByLabel("Nombre completo").fill("Autor QA Test");
    await page.getByLabel("Fecha de nacimiento").fill("1980-05-07");

    await page.locator("#author-nacionalidad").selectOption("");
    await page.locator("#author-nacionalidad").blur();

    await expect(page.getByText(/la nacionalidad es requerida/i)).toBeVisible();
  });

  test("valida fecha nacimiento año muy antiguo (<700)", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    await page.getByLabel("Nombre completo").fill("Autor Medieval");
    await page
      .getByRole("combobox", { name: /nacionalidad/i })
      .selectOption("España");
    await page.getByLabel("Fecha de nacimiento").fill("0500-01-01");
    await page.getByLabel("Fecha de nacimiento").blur();

    await expect(page.getByText(/no puede ser anterior a 700/i)).toBeVisible();
  });

  test("valida fecha nacimiento muy joven", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    await page.getByLabel("Nombre completo").fill("Autor QA");
    await page
      .getByRole("combobox", { name: /nacionalidad/i })
      .selectOption("Chile");

    await page.getByLabel("Fecha de nacimiento").fill("2022-01-01");
    await page.getByLabel("Fecha de nacimiento").blur();

    await expect(page.getByText(/no es válida/i)).toBeVisible();
  });

  test("happy path: crear autor con datos válidos", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo Autor" }).click();
    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).toBeVisible();

    const uniqueName = `Autor QA ${Date.now()}`;
    await page.getByLabel("Nombre completo").fill(uniqueName);
    await page
      .getByRole("combobox", { name: /nacionalidad/i })
      .selectOption("Argentina");
    await page.getByLabel("Fecha de nacimiento").fill("1970-05-15");

    const createButton = page.getByRole("button", { name: "Crear Autor" });
    await expect(createButton).toBeEnabled();

    await createButton.click();
    await page.waitForTimeout(1500);

    await expect(
      page.getByRole("heading", { name: "Nuevo Autor" }),
    ).not.toBeVisible();
  });

  test("buscar autores por nombre inexistente", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Buscar por nombre o nacionalidad...",
    );
    await searchInput.fill("autor-inexistente-qa-test-12345");
    await page.waitForTimeout(800);

    await expect(page.getByText(/no se encontraron autores/i)).toBeVisible();
  });
});
