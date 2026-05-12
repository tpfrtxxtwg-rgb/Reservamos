import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, clients, clientEmailSettings, optionalServices, vehicles, destinations } from "@db/schema";
import type { Booking } from "@db/schema";

// Lazy load nodemailer to avoid errors if not installed
let nodemailer: any = null;
let PdfPrinter: any = null;

try { nodemailer = require("nodemailer"); } catch { /* not installed */ }
try { PdfPrinter = require("pdfmake"); } catch { /* not installed */ }

function getEmailTransporter(smtpConfig: {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
}) {
  if (!nodemailer) throw new Error("nodemailer is not installed. Run: npm install nodemailer");
  if (!smtpConfig.smtpHost || !smtpConfig.smtpUser || !smtpConfig.smtpPass) {
    throw new Error("SMTP not configured");
  }
  return nodemailer.createTransport({
    host: smtpConfig.smtpHost,
    port: smtpConfig.smtpPort || 587,
    secure: (smtpConfig.smtpPort || 587) === 465,
    auth: {
      user: smtpConfig.smtpUser,
      pass: smtpConfig.smtpPass,
    },
  });
}

function buildConfirmationPdf(
  booking: Booking & { vehicle?: { name: string }; destinationInfo?: { name: string }; client?: { name: string; logoUrl?: string | null }; optionalServicesList?: string[] },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null },
  companyName: string
) {
  if (!PdfPrinter) throw new Error("pdfmake is not installed. Run: npm install pdfmake");

  const fonts = {
    Roboto: {
      normal: Buffer.from(""),
      bold: Buffer.from(""),
      italics: Buffer.from(""),
      bolditalics: Buffer.from(""),
    },
  };

  const printer = new PdfPrinter(fonts);

  const isRoundTrip = booking.tripType === "round_trip";
  const pickupTime = booking.departureTime
    ? (() => {
        const [h, m] = booking.departureTime.split(":");
        let hh = parseInt(h);
        let mm = parseInt(m) - 3 * 60;
        if (mm < 0) { mm += 60; hh -= 4; }
        while (mm < 0) { mm += 60; hh -= 1; }
        if (hh < 0) hh += 24;
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      })()
    : "";

  const docDefinition: any = {
    content: [
      // Company Logo & Info
      {
        columns: [
          booking.client?.logoUrl
            ? { image: booking.client.logoUrl, width: 120, fit: [120, 60] }
            : { text: companyName, style: "companyName" },
          {
            stack: [
              { text: companyName, style: "companyName" },
              emailSettings.companyWebsite
                ? { text: emailSettings.companyWebsite, style: "companyDetail" }
                : {},
              emailSettings.companyPhone
                ? { text: `Phone: ${emailSettings.companyPhone}`, style: "companyDetail" }
                : {},
            ],
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: "", margin: [0, 10] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: "#C75E3A" }] },
      { text: "", margin: [0, 15] },

      // Header
      {
        columns: [
          {
            stack: [
              { text: "RESERVATION VOUCHER", style: "header" },
              { text: `Confirmation #${booking.code}`, style: "subheader" },
            ],
          },
          {
            text: new Date(booking.createdAt || Date.now()).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            style: "dateText",
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Passenger Info
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: "#F5EFE6",
                text: "PASSENGER INFORMATION",
                style: "sectionHeader",
                border: [false, false, false, false],
                margin: [8, 6],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 8],
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: "Name", style: "label" },
              {
                text: `${booking.passengerName} ${booking.passengerLastName}`,
                style: "value",
              },
              { text: "Email", style: "label", margin: [0, 8, 0, 0] },
              { text: booking.passengerEmail, style: "value" },
            ],
          },
          {
            width: "50%",
            stack: [
              { text: "Phone", style: "label" },
              { text: booking.passengerPhone || "N/A", style: "value" },
              { text: "Reservation Code", style: "label", margin: [0, 8, 0, 0] },
              { text: booking.code, style: "valueBold" },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Service Details
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: "#F5EFE6",
                text: "SERVICE DETAILS",
                style: "sectionHeader",
                border: [false, false, false, false],
                margin: [8, 6],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 8],
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: "Service Type", style: "label" },
              {
                text: isRoundTrip ? "Round Trip" : "One Way",
                style: "value",
              },
              { text: "Vehicle", style: "label", margin: [0, 8, 0, 0] },
              { text: booking.vehicle?.name || "N/A", style: "value" },
              { text: "Passengers", style: "label", margin: [0, 8, 0, 0] },
              { text: String(booking.passengers), style: "value" },
            ],
          },
          {
            width: "50%",
            stack: [
              { text: "Destination", style: "label" },
              { text: booking.destinationInfo?.name || booking.destination, style: "value" },
              { text: "Arrival Date", style: "label", margin: [0, 8, 0, 0] },
              { text: `${booking.date} at ${booking.time}`, style: "value" },
              booking.origin && booking.origin !== booking.destination
                ? [
                    { text: "Origin", style: "label", margin: [0, 8, 0, 0] },
                    { text: booking.origin, style: "value" },
                  ]
                : {},
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Additional Services
      ...(booking.optionalServicesList && booking.optionalServicesList.length > 0
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      fillColor: "#F5EFE6",
                      text: "ADDITIONAL SERVICES",
                      style: "sectionHeader",
                      border: [false, false, false, false],
                      margin: [8, 6],
                    },
                  ],
                ],
              },
              margin: [0, 0, 0, 8],
              layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
            },
            {
              ul: booking.optionalServicesList.map((s: string) => ({ text: s, style: "value" })),
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Round Trip Details
      ...(isRoundTrip
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      fillColor: "#F5EFE6",
                      text: "RETURN TRIP DETAILS",
                      style: "sectionHeader",
                      border: [false, false, false, false],
                      margin: [8, 6],
                    },
                  ],
                ],
              },
              margin: [0, 0, 0, 8],
              layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
            },
            {
              columns: [
                {
                  width: "50%",
                  stack: [
                    { text: "Return Date", style: "label" },
                    { text: booking.departureDate || "N/A", style: "value" },
                    { text: "Pickup Location", style: "label", margin: [0, 8, 0, 0] },
                    { text: booking.origin || "N/A", style: "value" },
                  ],
                },
                {
                  width: "50%",
                  stack: [
                    { text: "Flight Number", style: "label" },
                    { text: booking.flightNumber || "N/A", style: "value" },
                    { text: "Airline", style: "label", margin: [0, 8, 0, 0] },
                    { text: booking.airline || "N/A", style: "value" },
                    ...(booking.departureTime
                      ? [
                          { text: "Flight Time", style: "label", margin: [0, 8, 0, 0] },
                          { text: booking.departureTime, style: "value" },
                        ]
                      : []),
                    ...(pickupTime
                      ? [
                          { text: "Suggested Pickup Time", style: "label", margin: [0, 8, 0, 0] },
                          {
                            text: `${pickupTime} (3 hours before flight)`,
                            style: "valueHighlight",
                          },
                        ]
                      : []),
                  ],
                },
              ],
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Flight Details (One Way)
      ...(!isRoundTrip && (booking.flightNumber || booking.airline)
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      fillColor: "#F5EFE6",
                      text: "FLIGHT INFORMATION",
                      style: "sectionHeader",
                      border: [false, false, false, false],
                      margin: [8, 6],
                    },
                  ],
                ],
              },
              margin: [0, 0, 0, 8],
              layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
            },
            {
              columns: [
                {
                  width: "50%",
                  stack: [
                    { text: "Flight Number", style: "label" },
                    { text: booking.flightNumber || "N/A", style: "value" },
                  ],
                },
                {
                  width: "50%",
                  stack: [
                    { text: "Airline", style: "label" },
                    { text: booking.airline || "N/A", style: "value" },
                  ],
                },
              ],
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Payment Summary
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: "#F5EFE6",
                text: "PAYMENT SUMMARY",
                style: "sectionHeader",
                border: [false, false, false, false],
                margin: [8, 6],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 8],
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: "Service Price", style: "label" },
              { text: `$${booking.price}`, style: "value" },
              { text: "Tax", style: "label", margin: [0, 8, 0, 0] },
              { text: `$${booking.tax}`, style: "value" },
            ],
          },
          {
            width: "50%",
            stack: [
              { text: "Total", style: "label" },
              { text: `$${booking.total}`, style: "totalValue" },
              { text: "Payment Status", style: "label", margin: [0, 8, 0, 0] },
              {
                text: booking.paymentStatus?.toUpperCase() || "PENDING",
                style: "value",
              },
              ...(parseFloat(booking.balanceDue || "0") > 0
                ? [
                    { text: "Balance Due", style: "label", margin: [0, 8, 0, 0] },
                    { text: `$${booking.balanceDue}`, style: "valueHighlight" },
                  ]
                : []),
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#C75E3A" }] },
      { text: "", margin: [0, 15] },

      // Pickup Instructions
      ...(emailSettings.pickupInstructions
        ? [
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      fillColor: "#C75E3A",
                      text: "HOW TO FIND YOUR DRIVER",
                      style: "sectionHeaderWhite",
                      border: [false, false, false, false],
                      margin: [8, 6],
                    },
                  ],
                ],
              },
              margin: [0, 0, 0, 8],
              layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
            },
            { text: emailSettings.pickupInstructions, style: "instructions" },
            { text: "", margin: [0, 15] },
          ]
        : []),

      // Footer
      {
        text: "Thank you for choosing our service. For any questions or changes, please contact us.",
        style: "footer",
        alignment: "center",
        margin: [0, 20, 0, 10],
      },
      {
        text: emailSettings.companyPhone || emailSettings.companyWebsite
          ? `${emailSettings.companyPhone || ""} ${emailSettings.companyWebsite || ""}`
          : "",
        style: "footer",
        alignment: "center",
      },
    ],
    styles: {
      companyName: { fontSize: 18, bold: true, color: "#3D3833" },
      companyDetail: { fontSize: 9, color: "#8A8278" },
      header: { fontSize: 22, bold: true, color: "#C75E3A" },
      subheader: { fontSize: 12, color: "#8A8278", margin: [0, 4, 0, 0] },
      dateText: { fontSize: 10, color: "#8A8278", margin: [0, 4, 0, 0] },
      sectionHeader: { fontSize: 11, bold: true, color: "#3D3833" },
      sectionHeaderWhite: { fontSize: 11, bold: true, color: "#FFFFFF" },
      label: { fontSize: 9, color: "#8A8278", margin: [0, 0, 0, 2] },
      value: { fontSize: 11, color: "#3D3833" },
      valueBold: { fontSize: 12, bold: true, color: "#C75E3A" },
      valueHighlight: { fontSize: 11, bold: true, color: "#2D6A4F" },
      totalValue: { fontSize: 14, bold: true, color: "#C75E3A" },
      instructions: { fontSize: 10, color: "#3D3833", lineHeight: 1.4 },
      footer: { fontSize: 9, color: "#8A8278" },
    },
    defaultStyle: {
      font: "Roboto",
    },
  };

  return printer.createPdfKitDocument(docDefinition);
}

async function generatePdfBuffer(
  booking: Booking & { vehicle?: { name: string }; destinationInfo?: { name: string }; client?: { name: string; logoUrl?: string | null }; optionalServicesList?: string[] },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null },
  companyName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = buildConfirmationPdf(booking, emailSettings, companyName);
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildHtmlEmail(
  booking: Booking & { vehicle?: { name: string }; destinationInfo?: { name: string }; optionalServicesList?: string[] },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null; smtpFrom?: string | null },
  companyName: string
): string {
  const isRoundTrip = booking.tripType === "round_trip";
  const pickupTime = booking.departureTime
    ? (() => {
        const [h, m] = booking.departureTime.split(":");
        let hh = parseInt(h);
        let mm = parseInt(m) - 3 * 60;
        if (mm < 0) { mm += 60; hh -= 4; }
        while (mm < 0) { mm += 60; hh -= 1; }
        if (hh < 0) hh += 24;
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      })()
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reservation Confirmation</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; background-color: #F5EFE6; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; }
  .header { background: #C75E3A; padding: 24px; text-align: center; }
  .header h1 { color: #FFFFFF; margin: 0; font-size: 20px; }
  .header p { color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 13px; }
  .content { padding: 24px; }
  .section { margin-bottom: 24px; }
  .section-title { background: #F5EFE6; padding: 10px 12px; font-size: 12px; font-weight: bold; color: #3D3833; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-radius: 6px; }
  .row { display: flex; flex-wrap: wrap; margin-bottom: 8px; }
  .col { flex: 1; min-width: 200px; padding-right: 12px; }
  .label { font-size: 11px; color: #8A8278; margin-bottom: 2px; }
  .value { font-size: 13px; color: #3D3833; font-weight: 600; }
  .value-highlight { font-size: 13px; color: #2D6A4F; font-weight: 700; }
  .total-row { background: #F5EFE6; padding: 12px; border-radius: 6px; margin-top: 12px; }
  .instructions { background: #FFF8F0; border-left: 4px solid #C75E3A; padding: 16px; border-radius: 0 6px 6px 0; margin-top: 16px; }
  .instructions h3 { margin: 0 0 8px; font-size: 13px; color: #C75E3A; }
  .instructions p { margin: 0; font-size: 12px; color: #3D3833; line-height: 1.5; }
  .footer { background: #3D3833; color: #FFFFFF; padding: 16px; text-align: center; font-size: 11px; }
  .footer a { color: #F5EFE6; }
  .badge { display: inline-block; background: #C75E3A; color: #FFF; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
  ul { margin: 0; padding-left: 18px; }
  ul li { font-size: 12px; color: #3D3833; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Reservation Confirmed</h1>
    <p>${companyName} &bull; Confirmation #${booking.code}</p>
  </div>
  <div class="content">
    ${emailSettings.message ? `<div style="margin-bottom:20px;font-size:13px;color:#3D3833;line-height:1.5;">${emailSettings.message.replace(/\n/g, "<br/>")}</div>` : ""}

    <div class="section">
      <div class="section-title">Passenger Information</div>
      <div class="row">
        <div class="col">
          <div class="label">Name</div>
          <div class="value">${booking.passengerName} ${booking.passengerLastName}</div>
        </div>
        <div class="col">
          <div class="label">Phone</div>
          <div class="value">${booking.passengerPhone || "N/A"}</div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;">
        <div class="col">
          <div class="label">Email</div>
          <div class="value">${booking.passengerEmail}</div>
        </div>
        <div class="col">
          <div class="label">Reservation Code</div>
          <div class="value-highlight">${booking.code}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Service Details</div>
      <div class="row">
        <div class="col">
          <div class="label">Service Type</div>
          <div class="value"><span class="badge">${isRoundTrip ? "Round Trip" : "One Way"}</span></div>
        </div>
        <div class="col">
          <div class="label">Destination</div>
          <div class="value">${booking.destinationInfo?.name || booking.destination}</div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;">
        <div class="col">
          <div class="label">Vehicle</div>
          <div class="value">${booking.vehicle?.name || "N/A"}</div>
        </div>
        <div class="col">
          <div class="label">Passengers</div>
          <div class="value">${booking.passengers}</div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;">
        <div class="col">
          <div class="label">Arrival Date</div>
          <div class="value">${booking.date} at ${booking.time}</div>
        </div>
        <div class="col">
          <div class="label">Origin</div>
          <div class="value">${booking.origin}</div>
        </div>
      </div>
    </div>

    ${booking.optionalServicesList && booking.optionalServicesList.length > 0 ? `
    <div class="section">
      <div class="section-title">Additional Services</div>
      <ul>
        ${booking.optionalServicesList.map((s) => `<li>${s}</li>`).join("")}
      </ul>
    </div>
    ` : ""}

    ${isRoundTrip ? `
    <div class="section">
      <div class="section-title">Return Trip Details</div>
      <div class="row">
        <div class="col">
          <div class="label">Return Date</div>
          <div class="value">${booking.departureDate || "N/A"}</div>
        </div>
        <div class="col">
          <div class="label">Flight Number</div>
          <div class="value">${booking.flightNumber || "N/A"}</div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;">
        <div class="col">
          <div class="label">Pickup Location</div>
          <div class="value">${booking.origin || "N/A"}</div>
        </div>
        <div class="col">
          <div class="label">Airline</div>
          <div class="value">${booking.airline || "N/A"}</div>
        </div>
      </div>
      ${booking.departureTime ? `
      <div class="row" style="margin-top:10px;">
        <div class="col">
          <div class="label">Flight Time</div>
          <div class="value">${booking.departureTime}</div>
        </div>
        <div class="col">
          <div class="label">Suggested Pickup Time</div>
          <div class="value-highlight">${pickupTime} (3 hours before flight)</div>
        </div>
      </div>
      ` : ""}
    </div>
    ` : ""}

    ${!isRoundTrip && (booking.flightNumber || booking.airline) ? `
    <div class="section">
      <div class="section-title">Flight Information</div>
      <div class="row">
        <div class="col">
          <div class="label">Flight Number</div>
          <div class="value">${booking.flightNumber || "N/A"}</div>
        </div>
        <div class="col">
          <div class="label">Airline</div>
          <div class="value">${booking.airline || "N/A"}</div>
        </div>
      </div>
    </div>
    ` : ""}

    <div class="section">
      <div class="section-title">Payment Summary</div>
      <div class="row">
        <div class="col">
          <div class="label">Service Price</div>
          <div class="value">$${booking.price}</div>
        </div>
        <div class="col">
          <div class="label">Tax</div>
          <div class="value">$${booking.tax}</div>
        </div>
      </div>
      <div class="total-row">
        <div class="row">
          <div class="col">
            <div class="label">Total</div>
            <div class="value" style="font-size:18px;color:#C75E3A;">$${booking.total}</div>
          </div>
          <div class="col">
            <div class="label">Payment Status</div>
            <div class="value">${booking.paymentStatus?.toUpperCase() || "PENDING"}</div>
            ${parseFloat(booking.balanceDue || "0") > 0 ? `<div class="label" style="margin-top:6px;">Balance Due</div><div class="value-highlight">$${booking.balanceDue}</div>` : ""}
          </div>
        </div>
      </div>
    </div>

    ${emailSettings.pickupInstructions ? `
    <div class="instructions">
      <h3>How to Find Your Driver</h3>
      <p>${emailSettings.pickupInstructions.replace(/\n/g, "<br/>")}</p>
    </div>
    ` : ""}
  </div>
  <div class="footer">
    <p>${companyName}${emailSettings.companyPhone ? ` &bull; ${emailSettings.companyPhone}` : ""}${emailSettings.companyWebsite ? ` &bull; <a href="${emailSettings.companyWebsite}">${emailSettings.companyWebsite}</a>` : ""}</p>
    <p style="margin-top:6px;font-size:10px;opacity:0.7;">Thank you for choosing our service.</p>
  </div>
</div>
</body>
</html>`;
}

// ─── tRPC Router ────────────────────────────────────────────────

export const emailRouter = createRouter({
  sendBookingConfirmation: publicQuery
    .input(z.object({ bookingId: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Fetch booking with related data
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
        with: {
          client: true,
          vehicle: true,
          destination: true,
          service: true,
        },
      });
      if (!booking) throw new Error("Booking not found");

      // Fetch client email settings
      const emailSettings = await db.query.clientEmailSettings.findFirst({
        where: eq(clientEmailSettings.clientId, booking.clientId),
      });

      // If email is not enabled or not configured, skip
      if (!emailSettings || !emailSettings.enabled) {
        return { sent: false, reason: "Email notifications disabled" };
      }

      // Build optional services list
      let optionalServicesList: string[] = [];
      if (booking.selectedOptionalServices && booking.selectedOptionalServices.length > 0) {
        const optServices = await db.query.optionalServices.findMany({
          where: and(
            eq(optionalServices.clientId, booking.clientId),
          ),
        });
        optionalServicesList = booking.selectedOptionalServices
          .map((id) => optServices.find((s) => s.id === id)?.name)
          .filter(Boolean) as string[];
      }

      const enrichedBooking = {
        ...booking,
        destinationInfo: booking.destination,
        optionalServicesList,
      };

      const companyName = booking.client?.name || "ReserVamos";

      // Build HTML email
      const htmlContent = buildHtmlEmail(enrichedBooking, emailSettings, companyName);

      // Generate PDF
      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await generatePdfBuffer(enrichedBooking, emailSettings, companyName);
      } catch {
        // PDF generation failed, continue with HTML email only
      }

      // Send email to passenger
      const transporter = getEmailTransporter(emailSettings);
      const subject = emailSettings.subject || "Your Reservation Confirmation";

      const mailOptions: any = {
        from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
        to: booking.passengerEmail,
        subject: `${subject} - #${booking.code}`,
        html: htmlContent,
      };

      if (pdfBuffer) {
        mailOptions.attachments = [
          {
            filename: `Reservation-${booking.code}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ];
      }

      await transporter.sendMail(mailOptions);

      // Send notification to admin
      const adminMailOptions = {
        from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
        to: booking.client?.email,
        subject: `New Reservation - #${booking.code}`,
        html: `<p>A new reservation has been received.</p>
               <p><strong>Code:</strong> ${booking.code}</p>
               <p><strong>Passenger:</strong> ${booking.passengerName} ${booking.passengerLastName}</p>
               <p><strong>Service:</strong> ${booking.tripType === "round_trip" ? "Round Trip" : "One Way"}</p>
               <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
               <p><strong>Total:</strong> $${booking.total}</p>`,
        ...(pdfBuffer ? {
          attachments: [{
            filename: `Reservation-${booking.code}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          }],
        } : {}),
      };

      await transporter.sendMail(adminMailOptions);

      return { sent: true, bookingCode: booking.code };
    }),
});

// Helper to send email automatically after booking creation (used by widget-router)
export async function sendBookingConfirmationEmail(bookingId: number) {
  try {
    const db = getDb();
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: { client: true, vehicle: true, destination: true },
    });
    if (!booking) return { sent: false, reason: "Booking not found" };

    const emailSettings = await db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, booking.clientId),
    });
    if (!emailSettings || !emailSettings.enabled) {
      return { sent: false, reason: "Email notifications disabled" };
    }
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass) {
      return { sent: false, reason: "SMTP not configured" };
    }

    let optionalServicesList: string[] = [];
    if (booking.selectedOptionalServices && booking.selectedOptionalServices.length > 0) {
      const optServices = await db.query.optionalServices.findMany({
        where: eq(optionalServices.clientId, booking.clientId),
      });
      optionalServicesList = booking.selectedOptionalServices
        .map((id) => optServices.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];
    }

    const enrichedBooking = {
      ...booking,
      destinationInfo: booking.destination,
      optionalServicesList,
    };

    const companyName = booking.client?.name || "ReserVamos";
    const htmlContent = buildHtmlEmail(enrichedBooking, emailSettings, companyName);

    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePdfBuffer(enrichedBooking, emailSettings, companyName);
    } catch {
      // Continue without PDF
    }

    const transporter = getEmailTransporter(emailSettings);
    const subject = emailSettings.subject || "Your Reservation Confirmation";

    const mailOptions: any = {
      from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
      to: booking.passengerEmail,
      subject: `${subject} - #${booking.code}`,
      html: htmlContent,
    };

    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `Reservation-${booking.code}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    // Admin notification
    await transporter.sendMail({
      from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
      to: booking.client?.email,
      subject: `New Reservation - #${booking.code}`,
      html: `<p>A new reservation has been received.</p>
             <p><strong>Code:</strong> ${booking.code}</p>
             <p><strong>Passenger:</strong> ${booking.passengerName} ${booking.passengerLastName}</p>
             <p><strong>Service:</strong> ${booking.tripType === "round_trip" ? "Round Trip" : "One Way"}</p>
             <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
             <p><strong>Total:</strong> $${booking.total}</p>`,
      ...(pdfBuffer ? {
        attachments: [{
          filename: `Reservation-${booking.code}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        }],
      } : {}),
    });

    return { sent: true, bookingCode: booking.code };
  } catch (error: any) {
    console.error("[Email] Failed to send confirmation:", error.message);
    return { sent: false, reason: error.message };
  }
}
