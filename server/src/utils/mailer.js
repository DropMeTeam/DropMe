import nodemailer from "nodemailer";

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
  if (!transporter) return; // silently skip if SMTP not configured

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Driver Registration Approved",
    text: `Hi ${name || ""},\n\nYour driver registration is approved.\nYour Driver ID: ${driverId}\n\nThank you.`,
  });
}
