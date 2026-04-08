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

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendDriverApprovedEmail({ to, name, driverId }) {
  const transporter = getMailer();
  if (!transporter) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Driver Registration Approved",
    text: `Hi ${name || ""},\n\nYour driver registration is approved.\nYour Driver ID: ${driverId}\n\nThank you.`,
  });
}

export async function sendTrainTicketEmail({ to, name, booking, pdfBuffer }) {
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
}