import nodemailer from "nodemailer";
import {
  getTrainTicketFilename,
  getTrainTicketNumber,
} from "../modules/train/utils/trainTicket.js";

export function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("Email configuration missing:", {
      hasHost: !!host,
      hasUser: !!user,
      hasPass: !!pass,
      port
    });
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter verification failed:", error);
    } else {
      console.log("Email transporter is ready");
    }
  });

  return transporter;
}

export async function sendDriverApprovedEmail({ to, name, driverId }) {
  const transporter = getMailer();
  if (!transporter) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "Driver Registration Approved",
      text: `Hi ${name || ""},\n\nYour driver registration is approved.\nYour Driver ID: ${driverId}\n\nThank you.`,
    });
    console.log(`Driver approved email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send driver approved email to ${to}:`, {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
}

export async function sendTrainTicketEmail({ to, name, booking, pdfBuffer }) {
  const transporter = getMailer();
  if (!transporter) {
    console.error("Email transporter not available - check SMTP configuration");
    return false;
  }
  
  if (!to) {
    console.error("Recipient email address missing");
    return false;
  }
  
  if (!pdfBuffer) {
    console.error("PDF buffer missing for train ticket");
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const ticketNumber = getTrainTicketNumber(booking);
  const filename = getTrainTicketFilename(booking);

  try {
    console.log(`Sending train ticket email to: ${to}`);
    
    const result = await transporter.sendMail({
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
    
    console.log(`Train ticket email sent successfully to: ${to}, MessageId: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send train ticket email to ${to}:`, {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
}

export async function sendBusTicketEmail({ to, name, booking, pdfBuffer }) {
  const transporter = getMailer();
  if (!transporter) {
    console.error("Email transporter not available - check SMTP configuration");
    return false;
  }
  
  if (!to) {
    console.error("Recipient email address missing");
    return false;
  }
  
  if (!pdfBuffer) {
    console.error("PDF buffer missing for bus ticket");
    return false;
  }

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

  try {
    console.log(`Sending bus ticket email to: ${to}`);
    
    const result = await transporter.sendMail({
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
    
    console.log(`Bus ticket email sent successfully to: ${to}, MessageId: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send bus ticket email to ${to}:`, {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
}