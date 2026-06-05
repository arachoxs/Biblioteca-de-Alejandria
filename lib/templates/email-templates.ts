const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const MOTIVO_LABELS: Record<string, string> = {
  "producto en mal estado": "Producto en mal estado",
  "no lleno las expectativas": "No llenó las expectativas",
  "el pedido llego a un tiempo superior al estipulado":
    "Pedido llegó con retraso",
};

const FONT = "Georgia, 'Times New Roman', serif";
const PRIMARY = "#49111c";
const ACCENT = "#a9927d";
const SECONDARY = "#5e503f";
const BG = "#f2f4f3";

function buildEmailHeader(iconHtml: string): string {
  return `
    <tr>
      <td style="background-color:${PRIMARY}; padding:32px 40px; text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding-bottom:16px;">
              <div style="width:56px; height:56px; margin:0 auto; border:2px solid ${ACCENT}; border-radius:50%; text-align:center; line-height:52px;">
                <span style="font-size:24px; color:${BG};">${iconHtml}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="margin:0; font-size:26px; font-weight:700; color:${BG}; letter-spacing:0.5px; font-family:${FONT};">
                Biblioteca de Alejandría
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background: linear-gradient(90deg, transparent, ${ACCENT}, transparent); height:2px; font-size:0; line-height:0;">
        &nbsp;
      </td>
    </tr>`;
}

function buildEmailFooter(subtitle: string): string {
  return `
    <tr>
      <td style="background-color:${PRIMARY}; padding:24px 40px; text-align:center;">
        <p style="margin:0 0 4px; font-size:13px; color:${ACCENT}; font-family:${FONT};">
          Biblioteca de Alejandría
        </p>
        <p style="margin:0; font-size:11px; color:rgba(169,146,125,0.6); font-family:${FONT};">
          ${escapeHtml(subtitle)}
        </p>
      </td>
    </tr>`;
}

function buildEmailShell(title: string, iconHtml: string, bodyHtml: string, footerSubtitle: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${BG}; font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 40px rgba(73,17,28,0.10);">
          ${buildEmailHeader(iconHtml)}
          ${bodyHtml}
          ${buildEmailFooter(footerSubtitle)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInfoCard(contentHtml: string): string {
  return `
    <tr>
      <td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:${BG}; border:1px solid ${ACCENT}; border-radius:12px; padding:20px;">
          <tr><td>${contentHtml}</td></tr>
        </table>
      </td>
    </tr>`;
}

function buildCtaButton(href: string, label: string): string {
  return `
    <tr>
      <td align="center" style="padding:0 40px 36px;">
        <a href="${href}"
           style="display:inline-block; background-color:${PRIMARY}; color:${BG}; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px; font-family:${FONT}; border:1px solid ${ACCENT};">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>`;
}

function buildDivider(): string {
  return `
    <tr>
      <td style="padding:0 40px;">
        <div style="height:1px; background-color:${ACCENT}; opacity:0.25;"></div>
      </td>
    </tr>`;
}

export const devolucionConfirmadaHtmlTemplate = (
  devolucionId: number,
  qrDataUrl: string,
  items: { titulo: string; motivo: string }[],
  detalleUrl: string,
) => {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid rgba(169,146,125,0.15); font-size:14px; color:${PRIMARY}; font-family:${FONT};">
        ${escapeHtml(item.titulo)}
      </td>
      <td style="padding:10px 0; border-bottom:1px solid rgba(169,146,125,0.15); font-size:13px; color:${SECONDARY}; text-align:right; font-family:${FONT};">
        ${escapeHtml(MOTIVO_LABELS[item.motivo] ?? item.motivo)}
      </td>
    </tr>`,
    )
    .join("");

  const body = `
    <tr>
      <td style="padding:36px 40px 20px;">
        <h2 style="margin:0 0 12px; font-size:22px; font-weight:700; color:${PRIMARY}; font-family:${FONT};">
          Devolución registrada
        </h2>
        <p style="margin:0 0 24px; font-size:15px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          Hemos recibido tu solicitud de devolución. Tu solicitud está <strong>en revisión</strong> y te notificaremos cuando sea procesada.
        </p>
      </td>
    </tr>
    ${buildInfoCard(`
      <p style="margin:0 0 12px; font-size:12px; color:${ACCENT}; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">
        Solicitud #${devolucionId}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsHtml}
      </table>
    `)}
    <tr>
      <td align="center" style="padding:0 40px 28px;">
        <p style="margin:0 0 16px; font-size:14px; color:${SECONDARY}; font-family:${FONT};">
          Escanea este código o haz clic en el botón para ver el detalle:
        </p>
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Código QR de devolución" width="160" height="160"
             style="display:block; margin:0 auto 20px; border-radius:8px; border:1px solid ${ACCENT};" />` : ""}
        <a href="${detalleUrl}"
           style="display:inline-block; background-color:${PRIMARY}; color:${BG}; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px; font-family:${FONT}; border:1px solid ${ACCENT};">
          Ver detalle de devolución
        </a>
      </td>
    </tr>
    ${buildDivider()}
    <tr>
      <td style="padding:24px 40px 36px;">
        <p style="margin:0; font-size:13px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          <strong>Nota:</strong> Solo puedes acceder al detalle de tu devolución mediante este enlace o escaneando el código QR.
        </p>
        <p style="margin:16px 0 0; font-size:12px; color:${ACCENT}; font-style:italic; line-height:1.6; font-family:${FONT};">
          Si no solicitaste esta devolución, por favor contacta al administrador de inmediato.
        </p>
      </td>
    </tr>`;

  return buildEmailShell(
    "Devolución Registrada — Biblioteca de Alejandría",
    "&#8635;",
    body,
    "Gestión de Devoluciones — Tu satisfacción es nuestra prioridad",
  );
};

export const cumpleanosHtmlTemplate = (nombre: string, porcentaje: number) => {
  const safeNombre = escapeHtml(nombre);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const body = `
    <tr>
      <td style="padding:36px 40px 20px;">
        <h2 style="margin:0 0 12px; font-size:22px; font-weight:700; color:${PRIMARY}; font-family:${FONT};">
          ¡Feliz cumpleaños, ${safeNombre}!
        </h2>
        <p style="margin:0 0 24px; font-size:15px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          Hoy es tu día especial y queremos celebrarlo contigo. Como regalo, tienes un
          <strong style="color:${PRIMARY};">${porcentaje}% de descuento</strong> en tu próxima compra del día.
        </p>
      </td>
    </tr>
    ${buildInfoCard(`
      <p style="margin:0 0 8px; font-size:12px; color:${ACCENT}; text-transform:uppercase; letter-spacing:1px; font-weight:bold; text-align:center;">
        Tu regalo de cumpleaños
      </p>
      <p style="margin:0; font-size:28px; font-weight:700; color:${PRIMARY}; font-family:${FONT}; text-align:center;">
        ${porcentaje}% OFF
      </p>
      <p style="margin:8px 0 0; font-size:13px; color:${SECONDARY}; text-align:center;">
        Se aplica automáticamente en tu próxima compra
      </p>
    `)}
    ${buildCtaButton(baseUrl, "Explorar libros")}
    ${buildDivider()}
    <tr>
      <td style="padding:24px 40px 36px;">
        <p style="margin:0; font-size:13px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          <strong>Nota:</strong> Esta promoción es válida solo por hoy y se aplica automáticamente al realizar tu compra. ¡No necesitas ningún código!
        </p>
      </td>
    </tr>`;

  return buildEmailShell(
    "¡Feliz Cumpleaños! — Biblioteca de Alejandría",
    "&#127874;",
    body,
    "¡Que tengas un día maravilloso!",
  );
};

export const newAdminHtmlTemplate = (email: string, password: string) => {
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const body = `
    <tr>
      <td style="padding:36px 40px 20px;">
        <h2 style="margin:0 0 12px; font-size:22px; font-weight:700; color:${PRIMARY}; font-family:${FONT};">
          Bienvenido al equipo de administración
        </h2>
        <p style="margin:0 0 24px; font-size:15px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          Se ha generado una nueva credencial de acceso para que puedas gestionar el catálogo y los registros de la Biblioteca.
        </p>
      </td>
    </tr>
    ${buildInfoCard(`
      <p style="padding-bottom:12px; margin:0; font-size:12px; color:${ACCENT}; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Correo Electrónico</p>
      <p style="margin:4px 0 0; font-size:16px; color:${PRIMARY}; font-family: 'Courier New', Courier, monospace;">${safeEmail}</p>
      <p style="padding-top:12px; border-top:1px dashed ${ACCENT}; margin:12px 0 0; font-size:12px; color:${ACCENT}; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Contraseña Temporal</p>
      <p style="margin:4px 0 0; font-size:16px; color:${PRIMARY}; font-family: 'Courier New', Courier, monospace; font-weight:bold;">${safePassword}</p>
    `)}
    ${buildCtaButton(`${baseUrl}/login`, "Acceder al Panel")}
    ${buildDivider()}
    <tr>
      <td style="padding:24px 40px 36px;">
        <p style="margin:0; font-size:13px; color:${SECONDARY}; line-height:1.6; font-family:${FONT};">
          <strong>Nota:</strong> Por seguridad, se te solicitará cambiar esta contraseña en tu primer inicio de sesión exitoso.
        </p>
        <p style="margin:16px 0 0; font-size:12px; color:${ACCENT}; font-style:italic; line-height:1.6; font-family:${FONT};">
          Si no esperabas esta invitación, por favor contacta al administrador del sistema de inmediato.
        </p>
      </td>
    </tr>`;

  return buildEmailShell(
    "Acceso Administrativo — Biblioteca de Alejandría",
    "&#9997;",
    body,
    "Módulo de Administración — Gestión de Conocimiento",
  );
};
