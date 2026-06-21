/**
 * Welcome Email - Sent automatically after successful registration
 * Uses system-level SendGrid/Resend configuration (not client-specific)
 */
import { getRawDb } from "../queries/connection";

interface WelcomeEmailData {
  companyName: string;
  email: string;
  apiKey: string;
  trialEnd: string;
  lang: string; // 'en' | 'es' | 'pt'
}

// System email config from environment or global settings
// Always reads client owner config for verified from address,
// env var only overrides the API key.
async function getSystemEmailConfig(): Promise<{ provider: string; apiKey: string; from: string } | null> {
  let apiKey = "";
  let provider = "";
  let verifiedFrom = "";

  // ── Step 1: ALWAYS read client owner config (for verified from address + fallback API key) ──
  try {
    const rawDb = getRawDb();
    const [rows] = await rawDb.execute(
      `SELECT smtp_host, smtp_user, smtp_from
       FROM client_email_settings WHERE clientId = 1 LIMIT 1`
    );
    const cfg = (rows as any[])[0];
    if (cfg) {
      verifiedFrom = cfg.smtp_from || "";
      if (cfg.smtp_user) {
        apiKey = cfg.smtp_user;
        provider = cfg.smtp_host === "resend" ? "resend" : "sendgrid";
        console.log(`[WelcomeEmail] Client owner config: provider=${provider}, from=${verifiedFrom}`);
      }
    }
  } catch (e: any) {
    console.log("[WelcomeEmail] Could not read client owner config:", e.message);
  }

  // ── Step 2: Override API key with env var if present ──
  const envKey = process.env.SENDGRID_API_KEY
    || process.env.RESEND_API_KEY
    || process.env.SMTP_USER
    || "";

  if (envKey) {
    apiKey = envKey;
    provider = process.env.RESEND_API_KEY ? "resend" : "sendgrid";
    console.log("[WelcomeEmail] Env var API key overrides client owner key");
  }

  if (!apiKey) {
    console.log("[WelcomeEmail] No email provider found");
    return null;
  }

  // ── Step 3: Determine verified from address ──
  // Priority: SYSTEM_EMAIL_FROM env var → client owner verified from → never use unverified fallback
  let from = process.env.SYSTEM_EMAIL_FROM
    || process.env.system_email_from
    || verifiedFrom
    || "";

  if (!from) {
    console.log("[WelcomeEmail] WARNING: No verified from address configured. SendGrid will reject.");
    console.log("[WelcomeEmail] To fix: Set SYSTEM_EMAIL_FROM in Railway or verify a sender in SendGrid.");
    // Return anyway — the error will be clear in logs
    from = "ReserVamos <noreply@vamosreserve.com>";
  }

  console.log(`[WelcomeEmail] Final config: provider=${provider}, from=${from}`);
  return { provider, apiKey, from };
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

// ─── Translations ───────────────────────────────────────────────

const t: Record<string, Record<string, string>> = {
  en: {
    subject: "Welcome to ReserVamos! Your trial is active",
    headline: "Welcome to ReserVamos!",
    greeting: "Hello {companyName},",
    body1: "Your account has been created successfully and your booking engine is ready to use.",
    trialLabel: "Your {days}-day free trial is active until:",
    whatsNext: "What's Next?",
    step1: "Log in to your admin panel to configure your services, zones, and vehicles",
    step2: "Copy your API key and add the booking widget to your website",
    step3: "Start receiving reservations directly from your clients",
    apiKeyLabel: "Your API Key",
    apiKeyDesc: "Use this key to embed the booking widget on your website:",
    loginLabel: "Access Your Dashboard",
    supportLabel: "Need Help?",
    supportText: "Contact us via WhatsApp for personalized support:",
    ctaWhatsapp: "Chat on WhatsApp",
    footer: "You're receiving this email because you registered for ReserVamos.",
    footer2: "ReserVamos - Booking Engine for Transportation Companies",
  },
  es: {
    subject: "¡Bienvenido a ReserVamos! Tu prueba está activa",
    headline: "¡Bienvenido a ReserVamos!",
    greeting: "Hola {companyName},",
    body1: "Tu cuenta ha sido creada exitosamente y tu motor de reservas está listo para usar.",
    trialLabel: "Tu prueba gratuita de {days} días está activa hasta:",
    whatsNext: "¿Qué sigue?",
    step1: "Inicia sesión en tu panel de administración para configurar tus servicios, zonas y vehículos",
    step2: "Copia tu API key y agrega el widget de reservas a tu sitio web",
    step3: "Empieza a recibir reservas directamente de tus clientes",
    apiKeyLabel: "Tu API Key",
    apiKeyDesc: "Usa esta clave para integrar el widget de reservas en tu sitio web:",
    loginLabel: "Acceder a tu Panel",
    supportLabel: "¿Necesitas Ayuda?",
    supportText: "Contáctanos por WhatsApp para soporte personalizado:",
    ctaWhatsapp: "Chat por WhatsApp",
    footer: "Recibes este correo porque te registraste en ReserVamos.",
    footer2: "ReserVamos - Motor de Reservas para Empresas de Transporte",
  },
  pt: {
    subject: "Bem-vindo ao ReserVamos! Seu teste está ativo",
    headline: "Bem-vindo ao ReserVamos!",
    greeting: "Olá {companyName},",
    body1: "Sua conta foi criada com sucesso e seu motor de reservas está pronto para usar.",
    trialLabel: "Seu teste gratuito de {days} dias está ativo até:",
    whatsNext: "E agora?",
    step1: "Faça login no seu painel de administração para configurar seus serviços, zonas e veículos",
    step2: "Copie sua API key e adicione o widget de reservas ao seu site",
    step3: "Comece a receber reservas diretamente de seus clientes",
    apiKeyLabel: "Sua API Key",
    apiKeyDesc: "Use esta chave para integrar o widget de reservas no seu site:",
    loginLabel: "Acessar seu Painel",
    supportLabel: "Precisa de Ajuda?",
    supportText: "Entre em contato pelo WhatsApp para suporte personalizado:",
    ctaWhatsapp: "Chat pelo WhatsApp",
    footer: "Você está recebendo este email porque se registrou no ReserVamos.",
    footer2: "ReserVamos - Motor de Reservas para Empresas de Transporte",
  },
};

// ─── HTML Builder ─────────────────────────────────────────────────

function buildWelcomeHtml(data: WelcomeEmailData): string {
  const lang = ["en", "es", "pt"].includes(data.lang) ? data.lang : "en";
  const d = t[lang];
  const trialEndDate = new Date(data.trialEnd).toLocaleDateString(
    lang === "es" ? "es-MX" : lang === "pt" ? "pt-BR" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
  const greeting = interpolate(d.greeting, { companyName: data.companyName });
  const trialLabel = interpolate(d.trialLabel, { days: "7" });
  const BASE_URL = process.env.APP_BASE_URL || "https://www.vamosreserve.com";
  const loginUrl = `${BASE_URL}/login`;
  const whatsappUrl = "https://wa.me/526243551663";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${d.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:'DM Sans',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C75E3A 0%,#A94C2E 100%);padding:40px 32px;text-align:center;">
              <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${d.headline}</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${d.body1}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;color:#3D3833;line-height:1.7;margin:0 0 20px;">${greeting}</p>

              <!-- Trial Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF8F0;border-left:4px solid #C75E3A;border-radius:0 12px 12px 0;margin:20px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#8A8278;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${trialLabel}</p>
                    <p style="margin:0;font-size:20px;color:#C75E3A;font-weight:700;">${trialEndDate}</p>
                  </td>
                </tr>
              </table>

              <!-- What's Next -->
              <h3 style="font-size:16px;color:#3D3833;margin:28px 0 16px;font-weight:700;">${d.whatsNext}</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;background:#F5EFE6;border-radius:10px;margin-bottom:8px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#C75E3A;border-radius:50%;text-align:center;vertical-align:middle;color:#FFFFFF;font-size:13px;font-weight:700;">1</td>
                        <td style="padding-left:12px;font-size:14px;color:#3D3833;line-height:1.5;">${d.step1}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:14px 16px;background:#F5EFE6;border-radius:10px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#C75E3A;border-radius:50%;text-align:center;vertical-align:middle;color:#FFFFFF;font-size:13px;font-weight:700;">2</td>
                        <td style="padding-left:12px;font-size:14px;color:#3D3833;line-height:1.5;">${d.step2}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:14px 16px;background:#F5EFE6;border-radius:10px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#C75E3A;border-radius:50%;text-align:center;vertical-align:middle;color:#FFFFFF;font-size:13px;font-weight:700;">3</td>
                        <td style="padding-left:12px;font-size:14px;color:#3D3833;line-height:1.5;">${d.step3}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- API Key -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;border:1px solid rgba(138,130,120,0.15);border-radius:10px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#8A8278;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${d.apiKeyLabel}</p>
                    <p style="margin:0 0 10px;font-size:13px;color:#3D3833;">${d.apiKeyDesc}</p>
                    <code style="display:block;background:#FFFFFF;border:1px solid rgba(138,130,120,0.12);border-radius:6px;padding:12px 16px;font-family:'Courier New',monospace;font-size:13px;color:#C75E3A;word-break:break-all;">${data.apiKey}</code>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:#C75E3A;color:#FFFFFF;padding:14px 40px;border-radius:50px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 4px 16px rgba(199,94,58,0.25);">${d.loginLabel}</a>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(138,130,120,0.12);margin-top:24px;padding-top:24px;">
                <tr>
                  <td style="text-align:center;padding:20px 0;">
                    <p style="margin:0 0 6px;font-size:14px;color:#3D3833;font-weight:600;">${d.supportLabel}</p>
                    <p style="margin:0 0 14px;font-size:13px;color:#8A8278;">${d.supportText}</p>
                    <a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#FFFFFF;padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;text-decoration:none;">
                      <span style="vertical-align:middle;">${d.ctaWhatsapp}</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#3D3833;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.5);">${d.footer}</p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">${d.footer2}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Functions ───────────────────────────────────────────────

async function sendViaSendGrid(params: { apiKey: string; from: string; to: string; subject: string; html: string }) {
  const { apiKey, from, to, subject, html } = params;

  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: "text/html", value: html },
    ],
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SendGrid HTTP ${response.status}: ${err}`);
  }
  return { sent: true };
}

async function sendViaResend(params: { apiKey: string; from: string; to: string; subject: string; html: string }) {
  const { apiKey, from, to, subject, html } = params;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend HTTP ${response.status}: ${err}`);
  }
  return { sent: true };
}

// ─── Public API ───────────────────────────────────────────────────

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ sent: boolean; reason?: string }> {
  console.log(`[WelcomeEmail] ===== START =====`);
  console.log(`[WelcomeEmail] Recipient: ${data.email}`);
  console.log(`[WelcomeEmail] Company: ${data.companyName}`);
  console.log(`[WelcomeEmail] Lang: ${data.lang}`);

  const config = await getSystemEmailConfig();
  if (!config) {
    console.log("[WelcomeEmail] SKIPPED: No email provider configured.");
    console.log("[WelcomeEmail] To fix: Add SENDGRID_API_KEY or sendgrid_api_key to Railway variables.");
    return { sent: false, reason: "No email provider configured" };
  }

  const lang = ["en", "es", "pt"].includes(data.lang) ? data.lang : "en";
  const subject = t[lang].subject;
  const html = buildWelcomeHtml(data);

  console.log(`[WelcomeEmail] Provider: ${config.provider}`);
  console.log(`[WelcomeEmail] From: ${config.from}`);
  console.log(`[WelcomeEmail] Subject: ${subject}`);

  try {
    if (config.provider === "resend") {
      await sendViaResend({
        apiKey: config.apiKey,
        from: config.from,
        to: data.email,
        subject,
        html,
      });
    } else {
      await sendViaSendGrid({
        apiKey: config.apiKey,
        from: config.from,
        to: data.email,
        subject,
        html,
      });
    }
    console.log(`[WelcomeEmail] ===== SUCCESS: Email sent to ${data.email} =====`);
    return { sent: true };
  } catch (err: any) {
    console.error("[WelcomeEmail] ===== FAILED =====");
    console.error("[WelcomeEmail] Error:", err.message);
    return { sent: false, reason: err.message };
  }
}
