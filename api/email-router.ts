import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { bookings, clientEmailSettings, optionalServices } from "@db/schema";
import type { Booking } from "@db/schema";

// Format a date with a specific IANA timezone (e.g., "America/Los_Angeles")
function formatDateTime(date: Date | string | null, timezone: string = "America/Los_Angeles", opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "N/A";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = opts || {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    return d.toLocaleString("en-US", { ...options, timeZone: timezone });
  } catch {
    return String(date);
  }
}

function formatDateOnly(date: Date | string | null, timezone: string = "America/Los_Angeles"): string {
  return formatDateTime(date, timezone, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimeOnly(date: Date | string | null, timezone: string = "America/Los_Angeles"): string {
  return formatDateTime(date, timezone, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// Helper to build HTML email (works without any external dependencies)
function buildHtmlEmail(
  booking: Booking & { vehicleName?: string; destinationName?: string; optionalServicesList?: string[]; clientName?: string; clientEmail?: string },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null; timezone?: string },
  companyName: string
): string {
  const tz = emailSettings.timezone || "America/Los_Angeles";
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
        <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">DEPARTURE INFORMATION</div>
        <div style="display:flex;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;padding-right:12px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Pickup Location (Hotel)</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin || "N/A"}</div>
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Destination (Airport)</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.destinationName || booking.destination}</div>
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Departure Date & Time</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.departureDate || "N/A"}${booking.departureTime ? ` at ${booking.departureTime}` : ""}</div>
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Hotel Pickup Time</div>
            <div style="font-size:13px;color:#2D6A4F;font-weight:700;">${pickupTime || "N/A"} ${pickupTime ? "(3 hours before flight)" : ""}</div>
            <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Airline</div>
            <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline || "N/A"}</div>
            ${booking.flightNumber ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Flight Number</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber}</div>` : ""}
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
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Reservation Information</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Reservation Code</div>
          <div style="font-size:13px;color:#C75E3A;font-weight:700;">${booking.code}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Reservation Date</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${formatDateTime(booking.createdAt, tz, { dateStyle: "medium", timeStyle: "short" })}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Passenger Information</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Name</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerName} ${booking.passengerLastName}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Email</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerEmail}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Phone</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerPhone || "N/A"}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Service Type</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;"><span style="display:inline-block;background:#C75E3A;color:#FFF;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">${isRoundTrip ? "Round Trip" : "One Way"}</span></div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Vehicle</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.vehicleName || "N/A"}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Passengers</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengers}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">ARRIVAL INFORMATION</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Pickup Location</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Destination</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.destinationName || booking.destination}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Arrival Date & Time</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.date} at ${booking.time}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          ${booking.flightNumber ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Flight Number</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber}</div>` : ""}
          ${booking.airline ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Airline</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline}</div>` : ""}
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
          ${booking.depositEnabled ? `
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Payment Status</div>
          <div style="font-size:13px;color:#2D6A4F;font-weight:600;">Deposit Paid: $${booking.depositAmount}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Balance Due</div>
          <div style="font-size:13px;color:#C75E3A;font-weight:700;">$${booking.balanceDue}</div>
          <div style="font-size:11px;color:#8A8278;font-style:italic;margin-top:6px;">* Remaining balance due in cash upon arrival.</div>
          ` : `
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Payment Status</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.paymentStatus?.toUpperCase() || "PENDING"}</div>
          ${balanceDueHtml}
          `}
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
  emailSettings: { pickupInstructions?: string | null; timezone?: string },
  companyName: string
): string {
  const tz = emailSettings.timezone || "America/Los_Angeles";
  const isRoundTrip = booking.tripType === "round_trip";
  const reservationDate = formatDateTime(booking.createdAt, tz, { dateStyle: "medium", timeStyle: "short" });

  let text = `RESERVATION CONFIRMED - ${booking.code}\n\n`;
  text += `Reservation Date: ${reservationDate}\n`;
  text += `Company: ${companyName}\n\n`;
  text += `Passenger: ${booking.passengerName} ${booking.passengerLastName}\n`;
  text += `Email: ${booking.passengerEmail}\n`;
  text += `Phone: ${booking.passengerPhone || "N/A"}\n`;
  text += `Service Type: ${isRoundTrip ? "Round Trip" : "One Way"}\n`;
  text += `Vehicle: ${booking.vehicleName || "N/A"}\n`;
  text += `Passengers: ${booking.passengers}\n\n`;
  text += `Pickup Location: ${booking.origin}\n`;
  text += `Destination: ${booking.destinationName || booking.destination}\n`;
  text += `Arrival Date & Time: ${booking.date} at ${booking.time}\n`;
  if (booking.flightNumber) {
    text += `Flight Number: ${booking.flightNumber}\n`;
  }
  if (booking.airline) {
    text += `Airline: ${booking.airline}\n`;
  }
  text += `Vehicle: ${booking.vehicleName || "N/A"}\n`;
  text += `Passengers: ${booking.passengers}\n`;
  text += `Total: $${booking.total}\n`;
  if (booking.depositEnabled) {
    text += `Payment Status: Deposit Paid: $${booking.depositAmount}\n`;
    text += `Balance Due: $${booking.balanceDue}\n`;
    text += `* Remaining balance due in cash upon arrival.\n`;
  }
  text += `\n`;
  if (booking.optionalServicesList?.length) {
    text += `Additional Services: ${booking.optionalServicesList.join(", ")}\n\n`;
  }
  if (isRoundTrip) {
    text += `DEPARTURE INFORMATION\n`;
    text += `----------------------\n`;
    text += `Pickup Location (Hotel): ${booking.origin}\n`;
    text += `Destination (Airport): ${booking.destinationName || booking.destination}\n`;
    text += `Departure Date & Time: ${booking.departureDate || "N/A"}${booking.departureTime ? ` at ${booking.departureTime}` : ""}\n`;
    text += `Airline: ${booking.airline || "N/A"}\n`;
    text += `Flight Number: ${booking.flightNumber || "N/A"}\n`;
    text += `Hotel Pickup Time: ${booking.departureTime ? calculatePickupTime(booking.departureTime) : "N/A"} (3 hours before flight)\n\n`;
  }
  if (emailSettings.pickupInstructions) {
    text += `Pickup Instructions:\n${emailSettings.pickupInstructions}\n\n`;
  }
  return text;
}

// Calculate hotel pickup time (3 hours before flight)
function calculatePickupTime(departureTime: string): string {
  const [h, m] = departureTime.split(":");
  let hh = parseInt(h);
  let mm = parseInt(m) - 3 * 60;
  if (mm < 0) { mm += 60; hh -= 1; }
  while (mm < 0) { mm += 60; hh -= 1; }
  if (hh < 0) hh += 24;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Build admin HTML email - same visual format as client but with "New Reservation" header
function buildAdminHtmlEmail(
  booking: Booking & { vehicleName?: string; destinationName?: string; optionalServicesList?: string[]; clientName?: string; clientEmail?: string },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null; timezone?: string },
  companyName: string
): string {
  const tz = emailSettings.timezone || "America/Los_Angeles";
  const isRoundTrip = booking.tripType === "round_trip";
  const reservationDate = formatDateTime(booking.createdAt, tz, { dateStyle: "medium", timeStyle: "short" });

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
    ? `<div style="margin-bottom:24px;"><div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">ADDITIONAL SERVICES</div><ul style="margin:0;padding-left:18px;">${booking.optionalServicesList.map((s: string) => `<li style="font-size:12px;color:#3D3833;margin-bottom:4px;">${s}</li>`).join("")}</ul></div>`
    : "";

  const roundTripHtml = isRoundTrip
    ? `<div style="margin-bottom:24px;"><div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">DEPARTURE INFORMATION</div>
        <div style="display:flex;flex-wrap:wrap;"><div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Pickup Location (Hotel)</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Destination (Airport)</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.destinationName || booking.destination}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Departure Date & Time</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.departureDate || "N/A"}${booking.departureTime ? ` at ${booking.departureTime}` : ""}</div>
        </div><div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Hotel Pickup Time</div><div style="font-size:13px;color:#2D6A4F;font-weight:700;">${pickupTime || "N/A"}${pickupTime ? " (3 hours before flight)" : ""}</div>
          ${booking.airline ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Airline</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline}</div>` : ""}
          ${booking.flightNumber ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Flight Number</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber}</div>` : ""}
        </div></div></div>`
    : "";

  const flightHtml = !isRoundTrip && (booking.flightNumber || booking.airline)
    ? `<div style="margin-bottom:24px;"><div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">FLIGHT INFORMATION</div>
        <div style="display:flex;flex-wrap:wrap;"><div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Flight Number</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber || "N/A"}</div>
        </div><div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Airline</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline || "N/A"}</div>
        </div></div></div>`
    : "";

  const balanceDueHtml = parseFloat(booking.balanceDue || "0") > 0
    ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Balance Due</div><div style="font-size:13px;color:#2D6A4F;font-weight:700;">$${booking.balanceDue}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Reservation</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background-color:#F5EFE6;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;">
  <div style="background:#8B5E3C;padding:24px;text-align:center;">
    <h1 style="color:#FFFFFF;margin:0;font-size:20px;">New Reservation Received</h1>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;">${companyName} &bull; Booking #${booking.code}</p>
  </div>
  <div style="padding:24px;">
    <div style="background:#FFF3E0;border-left:4px solid #8B5E3C;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;">
      <p style="margin:0;font-size:12px;color:#3D3833;"><strong>A new reservation has been placed through your booking widget.</strong> Please review the details below and contact the passenger to confirm.</p>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Reservation Information</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Reservation Code</div>
          <div style="font-size:13px;color:#C75E3A;font-weight:700;">${booking.code}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Reservation Date</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${reservationDate}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Service Type</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;"><span style="display:inline-block;background:#8B5E3C;color:#FFF;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">${isRoundTrip ? "Round Trip" : "One Way"}</span></div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">Passenger Information</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Name</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerName} ${booking.passengerLastName}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Email</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerEmail}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Phone</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengerPhone || "N/A"}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Service Type</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;"><span style="display:inline-block;background:#8B5E3C;color:#FFF;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">${isRoundTrip ? "Round Trip" : "One Way"}</span></div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Vehicle</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.vehicleName || "N/A"}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Passengers</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.passengers}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="background:#F5EFE6;padding:10px 12px;font-size:12px;font-weight:bold;color:#3D3833;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-radius:6px;">ARRIVAL INFORMATION</div>
      <div style="display:flex;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;padding-right:12px;">
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Pickup Location</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.origin}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Destination</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.destinationName || booking.destination}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Arrival Date & Time</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.date} at ${booking.time}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          ${booking.flightNumber ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;">Flight Number</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.flightNumber}</div>` : ""}
          ${booking.airline ? `<div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Airline</div><div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.airline}</div>` : ""}
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
          ${booking.depositEnabled ? `
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Payment Status</div>
          <div style="font-size:13px;color:#2D6A4F;font-weight:600;">Deposit Paid: $${booking.depositAmount}</div>
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Balance Due</div>
          <div style="font-size:13px;color:#C75E3A;font-weight:700;">$${booking.balanceDue}</div>
          <div style="font-size:11px;color:#8A8278;font-style:italic;margin-top:6px;">* Remaining balance due in cash upon arrival.</div>
          ` : `
          <div style="font-size:11px;color:#8A8278;margin-bottom:2px;margin-top:8px;">Payment Status</div>
          <div style="font-size:13px;color:#3D3833;font-weight:600;">${booking.paymentStatus?.toUpperCase() || "PENDING"}</div>
          ${balanceDueHtml}
          `}
        </div>
      </div>
    </div>

    ${emailSettings.pickupInstructions ? `<div style="background:#FFF8F0;border-left:4px solid #C75E3A;padding:16px;border-radius:0 6px 6px 0;margin-top:16px;"><h3 style="margin:0 0 8px;font-size:13px;color:#C75E3A;">Pickup Instructions</h3><p style="margin:0;font-size:12px;color:#3D3833;line-height:1.5;">${emailSettings.pickupInstructions.replace(/\n/g, "<br/>")}</p></div>` : ""}
  </div>
  <div style="background:#3D3833;color:#FFFFFF;padding:16px;text-align:center;font-size:11px;">
    <p>${companyName}${emailSettings.companyPhone ? ` &bull; ${emailSettings.companyPhone}` : ""}${emailSettings.companyWebsite ? ` &bull; <a href="${emailSettings.companyWebsite}" style="color:#F5EFE6;">${emailSettings.companyWebsite}</a>` : ""}</p>
    <p style="margin-top:6px;font-size:10px;opacity:0.7;">ReserVamos Booking System</p>
  </div>
</div>
</body>
</html>`;
}

// Build admin text email
function buildAdminTextEmail(
  booking: Booking & { vehicleName?: string; destinationName?: string; optionalServicesList?: string[]; clientName?: string; clientEmail?: string },
  emailSettings: { subject?: string; message?: string; pickupInstructions?: string | null; companyPhone?: string | null; companyWebsite?: string | null; timezone?: string },
  companyName: string
): string {
  const tz = emailSettings.timezone || "America/Los_Angeles";
  const isRoundTrip = booking.tripType === "round_trip";
  const reservationDate = formatDateTime(booking.createdAt, tz, { dateStyle: "medium", timeStyle: "short" });

  let text = `NEW RESERVATION - ${companyName}\n`;
  text += `========================================\n\n`;
  text += `A new reservation has been placed.\n\n`;
  text += `Reservation Code: ${booking.code}\n`;
  text += `Reservation Date: ${reservationDate}\n`;
  text += `Service: ${isRoundTrip ? "Round Trip" : "One Way"}\n\n`;
  text += `PASSENGER INFORMATION\n`;
  text += `----------------------\n`;
  text += `Name: ${booking.passengerName} ${booking.passengerLastName}\n`;
  text += `Email: ${booking.passengerEmail}\n`;
  text += `Phone: ${booking.passengerPhone || "N/A"}\n`;
  text += `Service Type: ${isRoundTrip ? "Round Trip" : "One Way"}\n`;
  text += `Vehicle: ${booking.vehicleName || "N/A"}\n`;
  text += `Passengers: ${booking.passengers}\n`;
  text += `Total: $${booking.total}\n`;
  if (booking.depositEnabled) {
    text += `Payment: Deposit ($${booking.depositAmount} paid) - Balance Due: $${booking.balanceDue}\n`;
    text += `Remaining balance due in cash upon arrival.\n`;
  }
  text += `\n`;
  text += `ARRIVAL INFORMATION\n`;
  text += `--------------------\n`;
  text += `Pickup Location: ${booking.origin}\n`;
  text += `Destination: ${booking.destinationName || booking.destination}\n`;
  text += `Arrival Date & Time: ${booking.date} at ${booking.time}\n`;
  if (booking.flightNumber) text += `Flight Number: ${booking.flightNumber}\n`;
  if (booking.airline) text += `Airline: ${booking.airline}\n\n`;
  if (booking.optionalServicesList?.length) {
    text += `Additional Services: ${booking.optionalServicesList.join(", ")}\n\n`;
  }
  if (isRoundTrip) {
    text += `DEPARTURE INFORMATION\n`;
    text += `----------------------\n`;
    text += `Pickup Location (Hotel): ${booking.origin}\n`;
    text += `Destination (Airport): ${booking.destinationName || booking.destination}\n`;
    text += `Departure Date & Time: ${booking.departureDate || "N/A"}${booking.departureTime ? ` at ${booking.departureTime}` : ""}\n`;
    text += `Airline: ${booking.airline || "N/A"}\n`;
    text += `Flight Number: ${booking.flightNumber || "N/A"}\n`;
    text += `Hotel Pickup Time: ${booking.departureTime ? calculatePickupTime(booking.departureTime) : "N/A"} (3 hours before flight)\n\n`;
  }
  text += `Payment Status: ${booking.paymentStatus?.toUpperCase() || "PENDING"}\n`;
  if (emailSettings.pickupInstructions) {
    text += `\nPickup Instructions:\n${emailSettings.pickupInstructions}\n`;
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

    // Fetch client email settings using raw SQL (avoids Drizzle selecting non-existent columns)
    const rawPool = getRawDb();
    const [settingsRows] = await rawPool.execute(
      `SELECT enabled, subject, message, pickupInstructions, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, company_phone, company_website
       FROM client_email_settings WHERE clientId = ? LIMIT 1`,
      [booking.clientId]
    );
    const rawSettings = (settingsRows as any[])[0];
    console.log(`[Email] Email settings found:`, !!rawSettings);

    if (!rawSettings || !rawSettings.enabled) {
      console.log("[Email] Email notifications disabled for client:", booking.clientId);
      return { sent: false, reason: "Email notifications disabled" };
    }

    // Detect provider from smtp_host ("sendgrid" or "resend" are magic values)
    const smtpHost = rawSettings.smtp_host || "";
    const smtpUser = rawSettings.smtp_user || "";
    const provider = smtpHost === "resend" ? "resend" : "sendgrid"; // default to sendgrid
    console.log(`[Email] Using provider: ${provider} (smtp_host=${smtpHost})`);

    if (!smtpUser) {
      console.log("[Email] API key not configured for provider:", provider);
      return { sent: false, reason: `${provider} API key not configured` };
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

    // Calculate deposit and balance due
    const depositEnabled = booking.client?.depositEnabled || false;
    const depositPercentage = booking.client?.depositPercentage || 100;
    const total = parseFloat(booking.total || "0");
    const depositAmount = depositEnabled ? (total * depositPercentage / 100) : total;
    const balanceDue = depositEnabled ? (total - depositAmount) : 0;

    const enrichedBooking = {
      ...booking,
      clientName: booking.client?.name,
      clientEmail: booking.client?.email,
      vehicleName: booking.vehicle?.name,
      destinationName: booking.destination?.name,
      optionalServicesList,
      createdAt: booking.createdAt,
      depositEnabled,
      depositPercentage,
      depositAmount: depositAmount.toFixed(2),
      balanceDue: balanceDue > 0 ? balanceDue.toFixed(2) : "0",
    };

    const companyName = booking.client?.name || "ReserVamos";
    const timezone = rawSettings.smtp_pass || "America/Los_Angeles";
    console.log(`[Email] Building email for company: ${companyName}, timezone: ${timezone}`);

    // Map raw DB columns to camelCase for email builder functions
    const emailSettings = {
      subject: rawSettings.subject,
      message: rawSettings.message,
      pickupInstructions: rawSettings.pickupInstructions,
      companyPhone: rawSettings.company_phone,
      companyWebsite: rawSettings.company_website,
      timezone,
    };

    const htmlContent = buildHtmlEmail(enrichedBooking, emailSettings, companyName);
    const textContent = buildTextEmail(enrichedBooking, emailSettings, companyName);

    // Build admin email with same format as client but with "New Reservation" header
    const adminHtmlContent = buildAdminHtmlEmail(enrichedBooking, emailSettings, companyName);
    const adminTextContent = buildAdminTextEmail(enrichedBooking, emailSettings, companyName);

    const subject = rawSettings.subject || "Your Reservation Confirmation";
    const fromEmail = rawSettings.smtp_from || `"${companyName}" <noreply@reservamos.app>`;

    if (provider === "resend") {
      return await sendViaResend({
        apiKey: smtpUser, // API key stored in smtp_user
        from: fromEmail,
        to: booking.passengerEmail,
        adminEmail: booking.client?.email,
        subject: `${subject} - #${booking.code}`,
        html: htmlContent,
        text: textContent,
        adminSubject: `New Reservation - #${booking.code}`,
        adminText: adminTextContent,
        adminHtml: adminHtmlContent,
      });
    }

    // Default: SendGrid
    console.log(`[Email] Sending via SendGrid to passenger=${booking.passengerEmail}, admin=${booking.client?.email || "none"}`);
    return await sendViaSendGrid({
      apiKey: smtpUser,
      from: fromEmail,
      to: booking.passengerEmail,
      adminEmail: booking.client?.email,
      subject: `${subject} - #${booking.code}`,
      html: htmlContent,
      text: textContent,
      adminSubject: `New Reservation - #${booking.code}`,
      adminText: adminTextContent,
      adminHtml: adminHtmlContent,
    });
  } catch (error: any) {
    console.error("[Email] CRITICAL ERROR:", error.message, error.stack);
    return { sent: false, reason: error.message };
  }
}

// ─── Send via SendGrid API ──────────────────────────────────────
async function sendViaSendGrid(params: {
  apiKey?: string | null;
  from: string;
  to: string;
  adminEmail?: string;
  subject: string;
  html: string;
  text: string;
  adminSubject: string;
  adminText: string;
  adminHtml: string;
}) {
  const { apiKey, from, to, adminEmail, subject, html, text, adminSubject, adminText, adminHtml } = params;
  if (!apiKey) return { sent: false, reason: "SendGrid API key not configured" };

  const sendEmail = async (recipient: string, emailSubject: string, emailHtml: string, emailText: string) => {
    console.log(`[Email/SendGrid] Sending to ${recipient}, from ${from}, subject: ${emailSubject.substring(0, 50)}...`);
    const body = {
      personalizations: [{ to: [{ email: recipient }] }],
      from: { email: from },
      subject: emailSubject,
      content: [
        { type: "text/plain", value: emailText },
        { type: "text/html", value: emailHtml },
      ],
    };
    console.log(`[Email/SendGrid] Request body:`, JSON.stringify(body).substring(0, 200));

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Email/SendGrid] HTTP ${response.status} error:`, errorBody);
      throw new Error(`SendGrid HTTP ${response.status}: ${errorBody}`);
    }
    console.log(`[Email/SendGrid] HTTP ${response.status} - Success`);
    return response;
  };

  try {
    await sendEmail(to, subject, html, text);
    console.log("[Email/SendGrid] Passenger email sent OK");
    if (adminEmail) {
      console.log(`[Email/SendGrid] Sending admin email to ${adminEmail}`);
      await sendEmail(adminEmail, adminSubject, adminHtml, adminText);
      console.log("[Email/SendGrid] Admin email sent OK");
    } else {
      console.log("[Email/SendGrid] No admin email configured (booking.client?.email is empty)");
    }
    return { sent: true, to, adminEmail: adminEmail || null };
  } catch (err: any) {
    console.error("[Email/SendGrid] Send failed:", err.message);
    return { sent: false, reason: "SendGrid error: " + err.message };
  }
}

// ─── Send via Resend API ────────────────────────────────────────
async function sendViaResend(params: {
  apiKey?: string | null;
  from: string;
  to: string;
  adminEmail?: string;
  subject: string;
  html: string;
  text: string;
  adminSubject: string;
  adminText: string;
  adminHtml: string;
}) {
  const { apiKey, from, to, adminEmail, subject, html, text, adminSubject, adminText, adminHtml } = params;
  if (!apiKey) return { sent: false, reason: "Resend API key not configured" };

  const sendEmail = async (recipient: string, emailSubject: string, emailHtml: string) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: recipient,
        subject: emailSubject,
        html: emailHtml,
        text: text,
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Resend HTTP ${response.status}: ${errorBody}`);
    }
    return response.json();
  };

  try {
    await sendEmail(to, subject, html);
    console.log("[Email/Resend] Passenger email sent");
    if (adminEmail) {
      await sendEmail(adminEmail, adminSubject, adminHtml);
      console.log("[Email/Resend] Admin email sent");
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: "Resend error: " + err.message };
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
