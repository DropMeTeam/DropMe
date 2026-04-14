import nodemailer from "nodemailer";
import {
  getTrainTicketFilename,
  getTrainTicketNumber,
} from "../modules/train/utils/trainTicket.js";

let cachedTransporter = null;
let transporterInitAttempted = false;

export function getMailer() {
  if (cachedTransporter) return cachedTransporter;
  if (transporterInitAttempted) return null;

  transporterInitAttempted = true;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[mailer] SMTP not configured. Missing one of SMTP_HOST / SMTP_USER / SMTP_PASS"
    );
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  cachedTransporter.verify((err) => {
    if (err) {
      console.error("[mailer] SMTP verification failed:", err.message);
    } else {
      console.log("[mailer] SMTP transporter verified successfully");
    }
  });

  return cachedTransporter;
}

export async function sendDriverApprovedEmail({ to, name, driverId }) {
  try {
    const transporter = getMailer();
    if (!transporter || !to) return false;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: "Driver Registration Approved",
      text: `Hi ${name || ""},\n\nYour driver registration is approved.\nYour Driver ID: ${driverId}\n\nThank you.`,
    });

    return true;
  } catch (err) {
    console.error("sendDriverApprovedEmail failed:", err);
    return false;
  }
}

export async function sendTrainTicketEmail({ to, name, booking, pdfBuffer }) {
  try {
    const transporter = getMailer();
    if (!transporter || !to || !pdfBuffer) return false;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const ticketNumber = getTrainTicketNumber(booking);
    const filename = getTrainTicketFilename(booking);

    await transporter.sendMail({
      from,
      to,
      subject: "Your DropMe train ticket",
      text:
        `Hi ${name || "Passenger"},\n\n` +
        `Your train payment was successful.\n` +
        `Ticket Number: ${ticketNumber}\n` +
        `Route: ${booking?.boardingStationName || "Boarding"} -> ${booking?.destinationStationName || "Destination"}\n` +
        `Travel Date: ${booking?.travelDate || "—"}\n` +
        `Seats: ${booking?.seats || 1}\n` +
        `Total Fare: LKR ${Number(booking?.totalFareLkr || 0).toFixed(2)}\n\n` +
        `Your ticket PDF is attached to this email.\n\n` +
        `Thank you for using DropMe Rail.`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return true;
  } catch (err) {
    console.error("sendTrainTicketEmail failed:", err);
    return false;
  }
}

export async function sendBusTicketEmail({ to, name, booking, pdfBuffer }) {
  try {
    const transporter = getMailer();
    if (!transporter || !to || !pdfBuffer) return false;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const passengerName =
      name ||
      booking?.passengerSnapshot?.name ||
      booking?.passengerSnapshot?.fullName ||
      "Passenger";

    const busNo = booking?.journeySnapshot?.busNumber || "-";
    const routeNo = booking?.journeySnapshot?.routeNumber || "-";
    const routeLabel = booking?.journeySnapshot?.routeLabel || "-";
    const pickup = booking?.pickupStop?.label || "-";
    const dropoff = booking?.dropoffStop?.label || "-";
    const pickupTime = booking?.pickupStop?.time || "-";
    const dropoffTime = booking?.dropoffStop?.time || "-";
    const seats = Array.isArray(booking?.seatNumbers)
      ? booking.seatNumbers.join(", ")
      : "-";
    const total = Number(booking?.totalAmountLkr || 0).toLocaleString();
    const travelDate = booking?.travelDate || "-";

    const html = `
      <div style="font-family: Arial, sans-serif; background:#0b1220; color:#f8fafc; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#111827; border:1px solid #334155; border-radius:18px; overflow:hidden;">
          <div style="padding:20px 24px; border-bottom:1px solid #334155; background:#020617;">
            <h1 style="margin:0; font-size:24px; color:#fbbf24;">DropMe Bus Ticket</h1>
            <p style="margin:8px 0 0; color:#cbd5e1;">Your payment was successful and your bus ticket PDF is attached.</p>
          </div>

          <div style="padding:24px;">
            <p style="margin-top:0;">Hello ${passengerName},</p>
            <p>Your bus ticket has been confirmed successfully.</p>

            <div style="margin-top:16px; padding:16px; border-radius:14px; background:#0f172a; border:1px solid #334155;">
              <p style="margin:0 0 8px;"><strong>Travel Date:</strong> ${travelDate}</p>
              <p style="margin:0 0 8px;"><strong>Bus No:</strong> ${busNo}</p>
              <p style="margin:0 0 8px;"><strong>Route No:</strong> ${routeNo}</p>
              <p style="margin:0 0 8px;"><strong>Bus Route:</strong> ${routeLabel}</p>
              <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${pickup} (${pickupTime})</p>
              <p style="margin:0 0 8px;"><strong>Dropoff:</strong> ${dropoff} (${dropoffTime})</p>
              <p style="margin:0 0 8px;"><strong>Seats:</strong> ${seats}</p>
              <p style="margin:0;"><strong>Total Paid:</strong> LKR ${total}</p>
            </div>

            <p style="margin-top:18px; color:#cbd5e1;">
              Your PDF bus ticket is attached to this email. Please keep it on your device and show it while boarding.
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: `DropMe Bus Ticket • ${travelDate}`,
      html,
      attachments: [
        {
          filename: `DropMe-Bus-Ticket-${booking?._id || "ticket"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return true;
  } catch (err) {
    console.error("sendBusTicketEmail failed:", err);
    return false;
  }
}