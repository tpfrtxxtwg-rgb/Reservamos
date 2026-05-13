import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, clientEmailSettings, optionalServices } from "@db/schema";
import type { Booking } from "@db/schema";

// Helper to build HTML email (works without any external dependencies)
function buildHtmlEmail(
  booking: Booking & { vehicleName?: string; destinationName?: string; optionalServicesList?: string[]; clientName?: string; clientEmail?: string },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null },
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

  const optionalServicesHtml = booking.optionalServicesList && booking.optionalServicesList.length > 0
    ? `<div style="margin-bottom:24px;">
        <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">ADDITIONAL SERVICES</div>
        <ul style="margin:0;padding-left:18px;">${booking.optionalServicesList.map((s: string) => `<li style="font-size:12px;color:#3D3833;margin-bottom:4px;">${s}</li>`).join("")}</ul>
      </div>`
    : "";

  const roundTripHtml = isRoundTrip
    ? `<div style="margin-bottom:24px;">
        <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">RETURN TRIP DETAILS</div>
        <div style="display:flex;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;padding-right:12px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Return Date</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.departureDate || "N/A"}</div>
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Pickup Location</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin || "N/A"}</div>
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Flight Number</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber || "N/A"}</div>
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Airline</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline || "N/A"}</div>
            ${booking.departureTime ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Flight Time</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.departureTime}</div>` : ""}
            ${pickupTime ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Suggested Pickup Time</div><div style="font-size:13px;color:#2D6A4F;font-weight:700;">${pickupTime} (3 hours before flight)</div>` : ""}
          </div>
        </div>
      </div>`
    : "";

  const flightHtml = !isRoundTrip && (booking.flightNumber || booking.airline)
    ? `<div style="margin-bottom:24px;">
        <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">FLIGHT INFORMATION</div>
        <div style="display:flex;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;padding-right:12px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Flight Number</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber || "N/A"}</div>
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Airline</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline || "N/A"}</div>
          </div>
        </div>
      </div>`
    : "";

  const balanceDueHtml = parseFloat(booking.balanceDue || "0") > 0
    ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Balance Due</div><div style="font-size:13px;color:#2D6A4F;font-weight:700;">$${booking.balanceDue}</div>`
    : "";

  const pickupInstructionsHtml = emailSettings.pickupInstructions
    ? `<div style="background:#FFF8F0;border-left:4px solid #C75E3A;padding:16px;border-radius:0 6px 6px 0;margin-top:16px;">
        <h3 style="margin:0 0 8px;font-size:13px;color:#C75E3A;">How to Find Your Driver</h3>
        <p style="margin:0;font-size:12px;color:#3D3833;line-height:1.5;">${emailSettings.pickupInstructions.replace(/\n/g, "<br/>")}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reservation Confirmation</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background-color:#F5EFE6;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;">
  <div style="background:#C75E3A;padding:24px;text-align:center;">
    <h1 style="color:#FFFFFF;margin:0;font-size:20px;">Reservation Confirmed</h1>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;">${companyName} &bull; Confirmation #${booking.code}</p>
  </div>
  <div style="padding:24px;">
    ${emailSettings.message ? `<div style="margin-bottom:20px;font-size:13px;color:#3D3833;line-height:1.5;">${emailSettings.message.replace(/\n/g, "<br/>")}</div>` : ""}

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Passenger Information</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Name</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerName} ${booking.passengerLastName}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Email</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerEmail}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Phone</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerPhone || "N/A"}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Reservation Code</div>
          <div style="font-size:13px;color:#C75E3A;font-weight:700;">${booking.code}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Service Details</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Service Type</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;"><span style="display:inline-block;background:#C75E3A;color:#FFF;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">${isRoundTrip ? "Round Trip" : "One Way"}</span></div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Vehicle</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.vehicleName || "N/A"}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Passengers</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengers}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Destination</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.destinationName || booking.destination}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Arrival Date</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.date} at ${booking.time}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Origin</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin}</div>
        </div>
      </div>
    </div>

    ${optionalServicesHtml}
    ${roundTripHtml}
    ${flightHtml}

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Payment Summary</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Service Price</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">$${booking.price}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Tax</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">$${booking.tax}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Total</div>
          <div style="font-size:18px;color:#C75E3A;font-weight:700;">$${booking.total}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Payment Status</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.paymentStatus?.toUpperCase() || "PENDING"}</div>
          ${balanceDueHtml}
        </div>
      </div>
    </div>

    ${pickupInstructionsHtml}
  </div>
  <div style="background:#3D3833;color:#FFFFFF;padding:16px;text-align:center;font-size:11px;">
    <p>${companyName}${emailSettings.companyPhone ? ` &bull; ${emailSettings.companyPhone}` : ""}${emailSettings.companyWebsite ? ` &bull; <a href="${emailSettings.companyWebsite}" style="color:#F5EFE6;">${emailSettings.companyWebsite}</a>` : ""}</p>
    <p style="margin-top:6px;font-size:10px;opacity:0.7;">Thank you for choosing our service.</p>
  </div>
</div>
</body>
</html>`;
}

// Build simple text fallback
function buildTextEmail(
  booking: Booking & { vehicleName?: string; destinationName?: string; optionalServicesList?: string[] },
  emailSettings: { pickupInstructions?: string | null },
  companyName: string
): string {
  const isRoundTrip = booking.tripType === "round_trip";
  let text = `RESERVATION CONFIRMED - ${booking.code}\n\n`;
  text += `Company: ${companyName}\n`;
  text += `Passenger: ${booking.passengerName} ${booking.passengerLastName}\n`;
  text += `Email: ${booking.passengerEmail}\n`;
  text += `Phone: ${booking.passengerPhone || "N/A"}\n\n`;
  text += `Service: ${isRoundTrip ? "Round Trip" : "One Way"}\n`;
  text += `Destination: ${booking.destinationName || booking.destination}\n`;
  text += `Date: ${booking.date} at ${booking.time}\n`;
  text += `Vehicle: ${booking.vehicleName || "N/A"}\n`;
  text += `Passengers: ${booking.passengers}\n`;
  text += `Total: $${booking.total}\n\n`;
  if (booking.optionalServicesList?.length) {
    text += `Additional Services: ${booking.optionalServicesList.join(", ")}\n\n`;
  }
  if (isRoundTrip) {
    text += `Return Date: ${booking.departureDate || "N/A"}\n`;
    text += `Flight: ${booking.flightNumber || "N/A"} (${booking.airline || "N/A"})\n\n`;
  }
  if (emailSettings.pickupInstructions) {
    text += `Pickup Instructions:\n${emailSettings.pickupInstructions}\n\n`;
  }
  return text;
}

// Main email sending function (exported for use by widget-router)
export async function sendBookingConfirmationEmail(bookingId: number) {
  console.log(`[Email] Starting sendBookingConfirmationEmail for bookingId=${bookingId}`);
  try {
    const db = getDb();

    // Fetch booking with related data
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        client: true,
        vehicle: true,
        destination: true,
      },
    });
    if (!booking) {
      console.log("[Email] Booking not found:", bookingId);
      return { sent: false, reason: "Booking not found" };
    }
    console.log(`[Email] Found booking #${booking.code} for clientId=${booking.clientId}`);

    // Fetch client email settings
    const emailSettings = await db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, booking.clientId),
    });
    console.log(`[Email] Email settings found:`, !!emailSettings);
    if (emailSettings) {
      console.log(`[Email] Settings: enabled=${emailSettings.enabled}, host=${emailSettings.smtpHost}, user=${emailSettings.smtpUser}, from=${emailSettings.smtpFrom}`);
    }

    if (!emailSettings || !emailSettings.enabled) {
      console.log("[Email] Email notifications disabled for client:", booking.clientId);
      return { sent: false, reason: "Email notifications disabled" };
    }
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass) {
      console.log("[Email] SMTP not configured. host:", emailSettings.smtpHost, "user:", emailSettings.smtpUser, "pass:", emailSettings.smtpPass ? "***" : "empty");
      return { sent: false, reason: "SMTP not configured" };
    }

    // Build optional services list
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
      clientName: booking.client?.name,
      clientEmail: booking.client?.email,
      vehicleName: booking.vehicle?.name,
      destinationName: booking.destination?.name,
      optionalServicesList,
    };

    const companyName = booking.client?.name || "ReserVamos";
    console.log(`[Email] Building email for company: ${companyName}`);
    const htmlContent = buildHtmlEmail(enrichedBooking, emailSettings, companyName);
    const textContent = buildTextEmail(enrichedBooking, emailSettings, companyName);

    // Try to send via nodemailer
    let nodemailer: any;
    try {
      const nodemailerMod = await import("nodemailer");
      nodemailer = nodemailerMod.default || nodemailerMod;
      console.log("[Email] nodemailer loaded successfully");
    } catch (err: any) {
      console.error("[Email] nodemailer import failed:", err.message);
      return { sent: false, reason: "nodemailer not available: " + err.message };
    }

    console.log(`[Email] Creating transport: host=${emailSettings.smtpHost}, port=${emailSettings.smtpPort || 587}`);
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort || 587,
      secure: (emailSettings.smtpPort || 587) === 465,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPass,
      },
    });

    // Verify connection
    console.log("[Email] Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("[Email] SMTP connection verified OK");
    } catch (verifyErr: any) {
      console.error("[Email] SMTP verification failed:", verifyErr.message);
      return { sent: false, reason: "SMTP connection failed: " + verifyErr.message };
    }

    const subject = emailSettings.subject || "Your Reservation Confirmation";

    // Send to passenger
    console.log(`[Email] Sending to passenger: ${booking.passengerEmail}`);
    const passengerResult = await transporter.sendMail({
      from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
      to: booking.passengerEmail,
      subject: `${subject} - #${booking.code}`,
      text: textContent,
      html: htmlContent,
    });
    console.log("[Email] Passenger email sent. MessageId:", passengerResult.messageId);

    // Send notification to admin
    const adminEmail = booking.client?.email;
    if (adminEmail) {
      console.log(`[Email] Sending admin notification to: ${adminEmail}`);
      const adminResult = await transporter.sendMail({
        from: emailSettings.smtpFrom || `"${companyName}" <noreply@reservamos.app>`,
        to: adminEmail,
        subject: `New Reservation - #${booking.code}`,
        text: `A new reservation has been received.\n\nCode: ${booking.code}\nPassenger: ${booking.passengerName} ${booking.passengerLastName}\nService: ${booking.tripType === "round_trip" ? "Round Trip" : "One Way"}\nDate: ${booking.date} at ${booking.time}\nTotal: $${booking.total}`,
        html: `<p>A new reservation has been received.</p><p><strong>Code:</strong> ${booking.code}</p><p><strong>Passenger:</strong> ${booking.passengerName} ${booking.passengerLastName}</p><p><strong>Service:</strong> ${booking.tripType === "round_trip" ? "Round Trip" : "One Way"}</p><p><strong>Date:</strong> ${booking.date} at ${booking.time}</p><p><strong>Total:</strong> $${booking.total}</p>`,
      });
      console.log("[Email] Admin email sent. MessageId:", adminResult.messageId);
    }

    console.log("[Email] All emails sent successfully for booking:", booking.code);
    return { sent: true, bookingCode: booking.code };
  } catch (error: any) {
    console.error("[Email] CRITICAL ERROR:", error.message, error.stack);
    return { sent: false, reason: error.message };
  }
}

// tRPC Router (manual trigger if needed)
export const emailRouter = createRouter({
  sendBookingConfirmation: publicQuery
    .input(z.object({ bookingId: z.number().positive() }))
    .mutation(async ({ input }) => {
      return sendBookingConfirmationEmail(input.bookingId);
    }),
});
