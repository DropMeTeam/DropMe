import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  } catch {}
  return String(value);
}

function formatTravelDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {}
  return String(value);
}

function formatTime(value) {
  if (!value || typeof value !== "string" || !value.includes(":")) return "—";
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "LKR 0.00";
  return `LKR ${amount.toFixed(2)}`;
}

export function getTrainTicketNumber(booking) {
  if (booking?.ticketNumber) return booking.ticketNumber;
  const rawId = String(booking?._id || "").slice(-8).toUpperCase();
  return `TRN-${rawId || "TICKET"}`;
}

export function getTrainTicketFilename(booking) {
  return `DropMe-Train-Ticket-${getTrainTicketNumber(booking)}.pdf`;
}

function safeText(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function tryResolveLogoPath() {
  const candidates = [
    process.env.DROPME_LOGO_PATH,
    path.resolve(process.cwd(), "uploads", "dropme-logo.jpg"),
    path.resolve(process.cwd(), "uploads", "dropme-logo.jpeg"),
    path.resolve(process.cwd(), "uploads", "logo.jpg"),
    path.resolve(process.cwd(), "uploads", "logo.jpeg"),
    path.resolve(process.cwd(), "public", "dropme-logo.jpg"),
    path.resolve(process.cwd(), "public", "dropme-logo.jpeg"),
    path.resolve(process.cwd(), "assets", "dropme-logo.jpg"),
    path.resolve(process.cwd(), "assets", "dropme-logo.jpeg"),
    path.resolve(process.cwd(), "src", "assets", "dropme-logo.jpg"),
    path.resolve(process.cwd(), "src", "assets", "dropme-logo.jpeg"),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

export async function generateTrainTicketPdfBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: { Title: "DropMe Train Ticket", Author: "DropMe" },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Theme colors
    const PAGE_BG = "#0A0A0A";
    const FRAME_BORDER = "#FFFFFF";
    const PRIMARY_TEXT = "#FFFFFF";
    const SECONDARY_TEXT = "#D1D5DB";
    const MUTED_LINE = "#F3F4F6";
    const ACCENT_BOX = "#FFFFFF";
    const LOGO_FALLBACK_PRIMARY = "#FFFFFF";
    const LOGO_FALLBACK_SECONDARY = "#D1D5DB";

    // ── Frame ──────────────────────────────────────────────────────────────
    const frameX = 55;
    const frameY = 45;
    const frameW = pageWidth - 110;
    const frameH = pageHeight - 90;

    doc.rect(0, 0, pageWidth, pageHeight).fill(PAGE_BG);

    doc
      .save()
      .lineWidth(1)
      .strokeColor(FRAME_BORDER)
      .rect(frameX, frameY, frameW, frameH)
      .stroke()
      .restore();

    // ── Data ───────────────────────────────────────────────────────────────
    const ticketNumber = getTrainTicketNumber(booking);
    const passengerName = safeText(booking?.passengerSnapshot?.name, "Passenger");
    const passengerEmail = safeText(booking?.passengerSnapshot?.email);
    const boardingStation = safeText(booking?.boardingStationName, "Boarding");
    const destinationStation = safeText(booking?.destinationStationName, "Destination");
    const trainName = safeText(booking?.journeySnapshot?.trainName, "Train Service");
    const trainNo = safeText(booking?.journeySnapshot?.trainNo);
    const departureTime = formatTime(booking?.journeySnapshot?.departureTime || "");
    const arrivalTime = formatTime(booking?.journeySnapshot?.arrivalTime || "");
    const durationLabel = safeText(booking?.journeySnapshot?.durationLabel);
    const travelDate = formatTravelDate(booking?.travelDate || "");
    const paidAt = formatDate(booking?.paidAt || booking?.updatedAt);
    const seats = Number(booking?.seats || 1);
    const farePerSeat = formatMoney(booking?.journeySnapshot?.farePerSeatLkr || 0);
    const totalFare = formatMoney(booking?.totalFareLkr || 0);

    // ── Logo + Title header ────────────────────────────────────────────────
    const logoX = frameX + 28;
    const logoY = frameY + 22;
    const logoPath = tryResolveLogoPath();

    if (logoPath) {
      doc.image(logoPath, logoX, logoY, { fit: [90, 90], align: "left", valign: "top" });
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(LOGO_FALLBACK_PRIMARY)
        .text("DropMe", logoX, logoY + 20);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(LOGO_FALLBACK_SECONDARY)
        .text("Rail", logoX + 4, logoY + 46);
    }

    const titleX = logoX + 45;
    const titleY = frameY + 58;

    doc
      .font("Helvetica")
      .fontSize(28)
      .fillColor(PRIMARY_TEXT)
      .text("DropMe Train Ticket", titleX, titleY, {
        width: frameW - 90 - 28,
        align: "center",
      });

    // ── Divider after header ───────────────────────────────────────────────
    const dividerL = frameX + 28;
    const dividerR = frameX + frameW - 28;

    function hLine(y) {
      doc
        .save()
        .lineWidth(0.8)
        .strokeColor(MUTED_LINE)
        .moveTo(dividerL, y)
        .lineTo(dividerR, y)
        .stroke()
        .restore();
    }

    // ── Route section ──────────────────────────────────────────────────────
    const routeY = frameY + 150;
    const colW = frameW / 2;
    const colLeft = frameX;
    const colRight = frameX + colW;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(SECONDARY_TEXT)
      .text("Booked from", colLeft, routeY, { width: colW, align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(SECONDARY_TEXT)
      .text("To", colRight, routeY, { width: colW, align: "center" });

    const stationY = routeY + 22;

    doc
      .font("Helvetica")
      .fontSize(26)
      .fillColor(PRIMARY_TEXT)
      .text(boardingStation, colLeft, stationY, { width: colW, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(26)
      .fillColor(PRIMARY_TEXT)
      .text(destinationStation, colRight, stationY, { width: colW, align: "center" });

    hLine(routeY + 74);

    // ── Passenger + Train ──────────────────────────────────────────────────
    const sec1Y = routeY + 94;
    const sec1ValY = sec1Y + 28;
    const leftCol = frameX + 28;
    const rightCol = frameX + frameW / 2 + 38;
    const colValW = frameW / 2 - 78;

    doc
      .font("Helvetica")
      .fontSize(16)
      .fillColor(PRIMARY_TEXT)
      .text("Passenger Details", leftCol, sec1Y);

    doc
      .font("Helvetica")
      .fontSize(16)
      .fillColor(PRIMARY_TEXT)
      .text("Train Details", rightCol, sec1Y);

    const passengerLines = [
      `Name : ${passengerName}`,
      `Email : ${passengerEmail}`,
    ];

    const trainLines = [
      `Name : ${trainName}`,
      `ID : ${trainNo}`,
    ];

    function drawLines(lines, x, startY, width) {
      let y = startY;
      for (const line of lines) {
        doc
          .font("Helvetica")
          .fontSize(11.5)
          .fillColor(SECONDARY_TEXT)
          .text(line, x, y, { width, align: "left", lineBreak: false });
        y += 18;
      }
      return y;
    }

    drawLines(passengerLines, leftCol, sec1ValY, colValW);
    drawLines(trainLines, rightCol, sec1ValY, colValW);

    hLine(sec1ValY + 56);

    // ── Journey + Fare ─────────────────────────────────────────────────────
    const sec2Y = sec1ValY + 74;
    const sec2ValY = sec2Y + 28;

    doc
      .font("Helvetica")
      .fontSize(16)
      .fillColor(PRIMARY_TEXT)
      .text("Journey Details", leftCol, sec2Y);

    doc
      .font("Helvetica")
      .fontSize(16)
      .fillColor(PRIMARY_TEXT)
      .text("Fare Details", rightCol, sec2Y);

    const journeyLines = [
      `Travel Date : ${travelDate}`,
      `Departure Time : ${departureTime}`,
      `Arrival Time : ${arrivalTime}`,
      `Duration : ${durationLabel}`,
    ];

    const fareLines = [
      `Seats : ${seats}`,
      `Fare Per Seat : ${farePerSeat}`,
      `Total Fare : ${totalFare}`,
      `Paid At : ${paidAt}`,
    ];

    drawLines(journeyLines, leftCol, sec2ValY, colValW);
    drawLines(fareLines, rightCol, sec2ValY, colValW);

    hLine(sec2ValY + 88);

    // ── Ticket number box ──────────────────────────────────────────────────
    const boxW = 280;
    const boxH = 64;
    const boxX = (pageWidth - boxW) / 2;
    const boxY = sec2ValY + 108;

    doc
      .save()
      .lineWidth(1.5)
      .strokeColor(ACCENT_BOX)
      .roundedRect(boxX, boxY, boxW, boxH, 14)
      .stroke()
      .restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(PRIMARY_TEXT)
      .text(`Ticket No: ${ticketNumber}`, boxX, boxY + 20, {
        width: boxW,
        align: "center",
      });

    // ── Footer ─────────────────────────────────────────────────────────────
    const footerY = frameY + frameH - 32;

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(SECONDARY_TEXT)
      .text(
        "Please carry this ticket during your journey. Thank you for using DropMe Rail.",
        frameX,
        footerY,
        { width: frameW, align: "center" }
      );

    doc.end();
  });
}