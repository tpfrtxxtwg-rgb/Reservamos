#!/usr/bin/env node
// Script para aplicar el modulo de email a Reservamos
// Ejecutar: node apply.js (desde la carpeta Reservamos)

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
console.log('Aplicando modulo de email en:', cwd);

// ============================================================================
// 1. COPIAR ARCHIVOS NUEVOS
// ============================================================================

const scriptDir = __dirname;

// Copiar api/email-settings-router.ts
fs.mkdirSync(path.join(cwd, 'api'), { recursive: true });
fs.copyFileSync(
  path.join(scriptDir, 'api', 'email-settings-router.ts'),
  path.join(cwd, 'api', 'email-settings-router.ts')
);
console.log('✓ api/email-settings-router.ts');

// Copiar api/email-router.ts
fs.copyFileSync(
  path.join(scriptDir, 'api', 'email-router.ts'),
  path.join(cwd, 'api', 'email-router.ts')
);
console.log('✓ api/email-router.ts');

// Copiar src/components/admin/AdminEmailSettings.tsx
fs.mkdirSync(path.join(cwd, 'src', 'components', 'admin'), { recursive: true });
fs.copyFileSync(
  path.join(scriptDir, 'src', 'components', 'admin', 'AdminEmailSettings.tsx'),
  path.join(cwd, 'src', 'components', 'admin', 'AdminEmailSettings.tsx')
);
console.log('✓ src/components/admin/AdminEmailSettings.tsx');

// ============================================================================
// 2. MODIFICAR package.json
// ============================================================================

const pkgPath = path.join(cwd, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Agregar dependencias
if (!pkg.dependencies.nodemailer) {
  pkg.dependencies.nodemailer = "^6.9.14";
  console.log('✓ package.json + nodemailer');
}
if (!pkg.dependencies.pdfmake) {
  pkg.dependencies.pdfmake = "^0.2.10";
  console.log('✓ package.json + pdfmake');
}
if (!pkg.devDependencies['@types/nodemailer']) {
  pkg.devDependencies['@types/nodemailer'] = "^6.4.15";
  console.log('✓ package.json + @types/nodemailer');
}
if (!pkg.devDependencies['@types/pdfmake']) {
  pkg.devDependencies['@types/pdfmake'] = "^0.2.9";
  console.log('✓ package.json + @types/pdfmake');
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// ============================================================================
// 3. MODIFICAR db/schema.ts
// ============================================================================

const schemaPath = path.join(cwd, 'db', 'schema.ts');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('clientEmailSettings')) {
  const emailTable = `// ─── Client Email Settings ──────────────────────────────────────
export const clientEmailSettings = mysqlTable("client_email_settings", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  subject: varchar("subject", { length: 255 }).default("Your Reservation Confirmation").notNull(),
  message: text("message").default("Thank you for your reservation. We look forward to serving you.").notNull(),
  pickupInstructions: text("pickupInstructions").default("").notNull(),
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: int("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPass: varchar("smtp_pass", { length: 255 }),
  smtpFrom: varchar("smtp_from", { length: 320 }),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("email_settings_client_idx").on(table.clientId),
}));

export type ClientEmailSetting = typeof clientEmailSettings.$inferSelect;
export type InsertClientEmailSetting = typeof clientEmailSettings.$inferInsert;

// ─── Bookings (Reservations) ───────────────────────────────────
`;
  schema = schema.replace('// ─── Bookings (Reservations) ───────────────────────────────────', emailTable);
  fs.writeFileSync(schemaPath, schema);
  console.log('✓ db/schema.ts + client_email_settings table');
} else {
  console.log('✓ db/schema.ts ya tiene clientEmailSettings');
}

// ============================================================================
// 4. MODIFICAR db/relations.ts
// ============================================================================

const relationsPath = path.join(cwd, 'db', 'relations.ts');
let relations = fs.readFileSync(relationsPath, 'utf8');

if (!relations.includes('clientEmailSettingsRelations')) {
  // Update import
  if (!relations.includes('clientEmailSettings')) {
    relations = relations.replace(
      'serviceTours } from "./schema"',
      'serviceTours, clientEmailSettings } from "./schema"'
    );
  }
  // Update clientsRelations
  relations = relations.replace(
    'export const clientsRelations = relations(clients, ({ many }) => ({',
    'export const clientsRelations = relations(clients, ({ many, one }) => ({'
  );
  relations = relations.replace(
    'tours: many(serviceTours),\n}));',
    `tours: many(serviceTours),
  emailSettings: one(clientEmailSettings, { fields: [clients.id], references: [clientEmailSettings.clientId] }),
}));

export const clientEmailSettingsRelations = relations(clientEmailSettings, ({ one }) => ({
  client: one(clients, { fields: [clientEmailSettings.clientId], references: [clients.id] }),
}));`
  );
  fs.writeFileSync(relationsPath, relations);
  console.log('✓ db/relations.ts + email settings relations');
} else {
  console.log('✓ db/relations.ts ya tiene relaciones');
}

// ============================================================================
// 5. MODIFICAR api/router.ts
// ============================================================================

const routerPath = path.join(cwd, 'api', 'router.ts');
let router = fs.readFileSync(routerPath, 'utf8');

if (!router.includes('emailSettingsRouter')) {
  // Add imports
  router = router.replace(
    'import { serviceTourRouter } from "./service-tour-router";',
    `import { serviceTourRouter } from "./service-tour-router";
import { emailSettingsRouter } from "./email-settings-router";
import { emailRouter } from "./email-router";`
  );
  // Add routers
  router = router.replace(
    'serviceTour: serviceTourRouter,\n});',
    `serviceTour: serviceTourRouter,
  emailSettings: emailSettingsRouter,
  email: emailRouter,
});`
  );
  fs.writeFileSync(routerPath, router);
  console.log('✓ api/router.ts + email routers');
} else {
  console.log('✓ api/router.ts ya tiene email routers');
}

// ============================================================================
// 6. MODIFICAR api/widget-router.ts
// ============================================================================

const widgetPath = path.join(cwd, 'api', 'widget-router.ts');
let widget = fs.readFileSync(widgetPath, 'utf8');

if (!widget.includes('sendBookingConfirmationEmail')) {
  // Add import
  widget = widget.replace(
    'import { clients, services, vehicles, destinations, vehicleZonePrices, bookings, optionalServices, serviceAirports, serviceTours } from "@db/schema";',
    `import { clients, services, vehicles, destinations, vehicleZonePrices, bookings, optionalServices, serviceAirports, serviceTours } from "@db/schema";
import { sendBookingConfirmationEmail } from "./email-router";`
  );
  // Add email send after booking creation
  widget = widget.replace(
    'return db.query.bookings.findFirst({ where: eq(bookings.id, id) });',
    `const createdBooking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });

      // Send confirmation email asynchronously (don\'t block the response)
      if (createdBooking) {
        sendBookingConfirmationEmail(createdBooking.id).catch((err) => {
          console.error("[Widget] Failed to send confirmation email:", err?.message || err);
        });
      }

      return createdBooking;`
  );
  fs.writeFileSync(widgetPath, widget);
  console.log('✓ api/widget-router.ts + auto email send');
} else {
  console.log('✓ api/widget-router.ts ya tiene auto email send');
}

// ============================================================================
// 7. MODIFICAR src/sections/AdminPanel.tsx
// ============================================================================

const adminPath = path.join(cwd, 'src', 'sections', 'AdminPanel.tsx');
let admin = fs.readFileSync(adminPath, 'utf8');

if (!admin.includes('AdminEmailSettings')) {
  // Add import
  admin = admin.replace(
    "import AdminSettings from '@/components/admin/AdminSettings';",
    `import AdminSettings from '@/components/admin/AdminSettings';
import AdminEmailSettings from '@/components/admin/AdminEmailSettings';`
  );
  // Add icon import
  if (!admin.includes('EnvelopeSimple')) {
    admin = admin.replace(
      '  SquaresFour, CalendarCheck, Car, Users, Calendar,',
      `  SquaresFour, CalendarCheck, Car, Users, Calendar,
  EnvelopeSimple,`
    );
  }
  // Add sidebar item
  admin = admin.replace(
    "    { icon: <ChartBar size={20} />, label: t('admin.reports'), id: 'reports' },",
    `    { icon: <ChartBar size={20} />, label: t('admin.reports'), id: 'reports' },
    { icon: <EnvelopeSimple size={20} />, label: t('admin.email') || 'Email', id: 'email' },`
  );
  // Add case
  admin = admin.replace(
    "      case 'settings': return <AdminSettings clientId={clientId} />;",
    `      case 'email': return <AdminEmailSettings clientId={clientId} />;
      case 'settings': return <AdminSettings clientId={clientId} />;`
  );
  fs.writeFileSync(adminPath, admin);
  console.log('✓ src/sections/AdminPanel.tsx + Email tab');
} else {
  console.log('✓ src/sections/AdminPanel.tsx ya tiene Email tab');
}

// ============================================================================
// 8. MODIFICAR i18n
// ============================================================================

const emailTranslations = {
  en: `    "settingsSaved": "Settings saved successfully",
    "saveChanges": "Save Changes",
    "email": "Email",
    "emailSettings": "Email Configuration",
    "emailSettingsDesc": "Configure confirmation emails sent to your customers",
    "emailConfigured": "SMTP is configured — confirmation emails will be sent automatically",
    "emailNotConfigured": "SMTP not configured — add your email server details below",
    "emailStatusInfo": "When enabled, every new booking triggers an automatic email with a PDF voucher to the customer and a notification to you.",
    "emailEnabled": "Send Confirmation Emails",
    "emailEnabledDesc": "Automatically send confirmation emails when a booking is created",
    "emailContent": "Email Content",
    "emailSubject": "Email Subject",
    "emailSubjectDesc": "The booking code will be appended automatically",
    "emailMessage": "Welcome Message",
    "emailMessageDesc": "This message appears at the top of the confirmation email",
    "pickupInstructions": "Pickup Instructions",
    "pickupInstructionsDesc": "Instructions for the customer on how to find their driver at the airport. Shown in both the email and the PDF voucher.",
    "companyContactInfo": "Company Contact Info",
    "companyContactDesc": "Shown in the PDF voucher sent to customers",
    "companyPhone": "Phone Number",
    "companyWebsite": "Website",
    "smtpSettings": "SMTP Server Settings",
    "smtpDesc": "Configure your email server. We recommend using SendGrid, Mailgun, AWS SES, or Gmail SMTP.",
    "smtpHost": "SMTP Host",
    "smtpPort": "SMTP Port",
    "smtpUser": "SMTP Username",
    "smtpPass": "SMTP Password",
    "smtpFrom": "From Email Address",
    "smtpFromDesc": "This is the sender address customers will see",
    "smtpProviders": "Popular SMTP Providers:"`,

  es: `    "settingsSaved": "Configuración guardada exitosamente",
    "saveChanges": "Guardar Cambios",
    "email": "Correo",
    "emailSettings": "Configuración de Correo",
    "emailSettingsDesc": "Configura los correos de confirmación enviados a tus clientes",
    "emailConfigured": "SMTP configurado — los correos de confirmación se enviarán automáticamente",
    "emailNotConfigured": "SMTP no configurado — agrega los datos de tu servidor de correo",
    "emailStatusInfo": "Cuando está activo, cada nueva reserva envía automáticamente un correo con voucher PDF al cliente y una notificación a ti.",
    "emailEnabled": "Enviar Correos de Confirmación",
    "emailEnabledDesc": "Enviar correos de confirmación automáticamente al crear una reserva",
    "emailContent": "Contenido del Correo",
    "emailSubject": "Asunto del Correo",
    "emailSubjectDesc": "El código de reserva se agregará automáticamente",
    "emailMessage": "Mensaje de Bienvenida",
    "emailMessageDesc": "Este mensaje aparece al inicio del correo de confirmación",
    "pickupInstructions": "Instrucciones de Recogida",
    "pickupInstructionsDesc": "Indicaciones para el cliente sobre cómo encontrar a su conductor en el aeropuerto. Se muestra en el correo y en el voucher PDF.",
    "companyContactInfo": "Información de Contacto de la Empresa",
    "companyContactDesc": "Se muestra en el voucher PDF enviado a los clientes",
    "companyPhone": "Teléfono",
    "companyWebsite": "Sitio Web",
    "smtpSettings": "Configuración del Servidor SMTP",
    "smtpDesc": "Configura tu servidor de correo. Recomendamos SendGrid, Mailgun, AWS SES o Gmail SMTP.",
    "smtpHost": "Host SMTP",
    "smtpPort": "Puerto SMTP",
    "smtpUser": "Usuario SMTP",
    "smtpPass": "Contraseña SMTP",
    "smtpFrom": "Correo de Envío (From)",
    "smtpFromDesc": "Esta es la dirección que los clientes verán como remitente",
    "smtpProviders": "Proveedores SMTP populares:"`,

  pt: `    "settingsSaved": "Configurações salvas com sucesso",
    "saveChanges": "Salvar Alterações",
    "email": "E-mail",
    "emailSettings": "Configuração de E-mail",
    "emailSettingsDesc": "Configure os e-mails de confirmação enviados aos seus clientes",
    "emailConfigured": "SMTP configurado — e-mails de confirmação serão enviados automaticamente",
    "emailNotConfigured": "SMTP não configurado — adicione os dados do seu servidor de e-mail",
    "emailStatusInfo": "Quando ativado, cada nova reserva dispara automaticamente um e-mail com voucher PDF ao cliente e uma notificação para você.",
    "emailEnabled": "Enviar E-mails de Confirmação",
    "emailEnabledDesc": "Enviar e-mails de confirmação automaticamente ao criar uma reserva",
    "emailContent": "Conteúdo do E-mail",
    "emailSubject": "Assunto do E-mail",
    "emailSubjectDesc": "O código da reserva será adicionado automaticamente",
    "emailMessage": "Mensagem de Boas-vindas",
    "emailMessageDesc": "Esta mensagem aparece no início do e-mail de confirmação",
    "pickupInstructions": "Instruções de Encontro",
    "pickupInstructionsDesc": "Instruções para o cliente sobre como encontrar seu motorista no aeroporto. Exibido no e-mail e no voucher PDF.",
    "companyContactInfo": "Informações de Contato da Empresa",
    "companyContactDesc": "Exibido no voucher PDF enviado aos clientes",
    "companyPhone": "Telefone",
    "companyWebsite": "Website",
    "smtpSettings": "Configurações do Servidor SMTP",
    "smtpDesc": "Configure seu servidor de e-mail. Recomendamos SendGrid, Mailgun, AWS SES ou Gmail SMTP.",
    "smtpHost": "Host SMTP",
    "smtpPort": "Porta SMTP",
    "smtpUser": "Usuário SMTP",
    "smtpPass": "Senha SMTP",
    "smtpFrom": "E-mail de Envio (From)",
    "smtpFromDesc": "Este é o endereço que os clientes verão como remetente",
    "smtpProviders": "Provedores SMTP populares:"`
};

for (const [lang, translations] of Object.entries(emailTranslations)) {
  const i18nPath = path.join(cwd, 'src', 'i18n', `${lang}.json`);
  let i18n = fs.readFileSync(i18nPath, 'utf8');

  if (!i18n.includes('"email"')) {
    // Replace the last two lines of admin section
    const oldEnding = lang === 'en'
      ? `    "settingsSaved": "Settings saved successfully",\n    "saveChanges": "Save Changes"\n  }`
      : lang === 'es'
        ? `    "settingsSaved": "Configuración guardada exitosamente",\n    "saveChanges": "Guardar Cambios"\n  }`
        : `    "settingsSaved": "Configurações salvas com sucesso",\n    "saveChanges": "Salvar Alterações"\n  }`;

    i18n = i18n.replace(oldEnding, translations + '\n  }');
    fs.writeFileSync(i18nPath, i18n);
    console.log(`✓ src/i18n/${lang}.json + email translations`);
  } else {
    console.log(`✓ src/i18n/${lang}.json ya tiene traducciones`);
  }
}

// ============================================================================
// 9. Dockerfile (usar el original del repo, que ya funciona con npm ci)
// ============================================================================

console.log('');
console.log('========================================');
console.log('  Modulo de email aplicado!');
console.log('========================================');
console.log('');
console.log('Ahora ejecuta:');
console.log('  rm -f package-lock.json');
console.log('  npm install');
console.log('  git add -A');
console.log('  git commit -m "feat(email): add confirmation module"');
console.log('  git push origin main');
console.log('');
