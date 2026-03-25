export const newAdminHtmlTemplate = (email: string, password: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Acceso Administrativo — Biblioteca de Alejandría</title>
  </head>
<body style="margin:0; padding:0; background-color:#f2f4f3; font-family:Georgia, 'Times New Roman', serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f4f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 40px rgba(73,17,28,0.10);">

          <tr>
            <td style="background-color:#49111c; padding:32px 40px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-bottom:16px;">
                    <div style="width:56px; height:56px; margin:0 auto; border:2px solid #a9927d; border-radius:50%; text-align:center; line-height:52px;">
                      <span style="font-size:24px; color:#f2f4f3;">&#9997;</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="margin:0; font-size:26px; font-weight:700; color:#f2f4f3; letter-spacing:0.5px; font-family:Georgia, 'Times New Roman', serif;">
                      Biblioteca de Alejandría
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background: linear-gradient(90deg, transparent, #a9927d, transparent); height:2px; font-size:0; line-height:0;">
              &nbsp;
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#49111c; font-family:Georgia, 'Times New Roman', serif;">
                Bienvenido al equipo de administración
              </h2>
              <p style="margin:0 0 24px; font-size:15px; color:#5e503f; line-height:1.6; font-family:Georgia, 'Times New Roman', serif;">
                Se ha generado una nueva credencial de acceso para que puedas gestionar el catálogo y los registros de la Biblioteca.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f4f3; border:1px solid #a9927d; border-radius:12px; padding:24px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0; font-size:12px; color:#a9927d; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Correo Electrónico</p>
                    <p style="margin:4px 0 0; font-size:16px; color:#49111c; font-family: 'Courier New', Courier, monospace;">${email}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px; border-top:1px dashed #a9927d;">
                    <p style="margin:0; font-size:12px; color:#a9927d; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Contraseña Temporal</p>
                    <p style="margin:4px 0 0; font-size:16px; color:#49111c; font-family: 'Courier New', Courier, monospace; font-weight:bold;">${password}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 40px 36px;">
              <a href="https://biblioteca-de-alejandria-delta.vercel.app/login" 
                 style="display:inline-block; background-color:#49111c; color:#f2f4f3; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px; font-family:Georgia, 'Times New Roman', serif; border:1px solid #a9927d;">
                Acceder al Panel
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#a9927d; opacity:0.25;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0; font-size:13px; color:#5e503f; line-height:1.6; font-family:Georgia, 'Times New Roman', serif;">
                <strong>Nota:</strong> Por seguridad, se te solicitará cambiar esta contraseña en tu primer inicio de sesión exitoso.
              </p>
              <p style="margin:16px 0 0; font-size:12px; color:#a9927d; font-style:italic; line-height:1.6; font-family:Georgia, 'Times New Roman', serif;">
                Si no esperabas esta invitación, por favor contacta al administrador del sistema de inmediato.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#49111c; padding:24px 40px; text-align:center;">
              <p style="margin:0 0 4px; font-size:13px; color:#a9927d; font-family:Georgia, 'Times New Roman', serif;">
                Biblioteca de Alejandría
              </p>
              <p style="margin:0; font-size:11px; color:rgba(169,146,125,0.6); font-family:Georgia, 'Times New Roman', serif;">
                Módulo de Administración — Gestión de Conocimiento
              </p>
            </td>
          </tr>

        </table>
        </td>
    </tr>
  </table>
  </body>
</html>
`;