import nodemailer from "nodemailer";

export function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendDriverApprovedEmail({ to, driverId }) {
  const transporter = createTransport();

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "DropMe Driver Registration Approved",
    text: `Your driver registration is approved.\nDriver ID: ${driverId}\n\nYou can now add rides in your dashboard.`,
  });
}
