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

    const pageWidth = doc.page.width;   // 595
    const pageHeight = doc.page.height; // 842

    // ── Frame ──────────────────────────────────────────────────────────────
    const frameX = 55;
    const frameY = 45;
    const frameW = pageWidth - 110;   // 485
    const frameH = pageHeight - 90;   // 752

    doc.rect(0, 0, pageWidth, pageHeight).fill("#FFFFFF");
    doc
      .save()
      .lineWidth(1)
      .strokeColor("#2F2F2F")
      .rect(frameX, frameY, frameW, frameH)
      .stroke()
      .restore();

    // ── Data ───────────────────────────────────────────────────────────────
    const ticketNumber        = getTrainTicketNumber(booking);
    const passengerName       = safeText(booking?.passengerSnapshot?.name, "Passenger");
    const passengerEmail      = safeText(booking?.passengerSnapshot?.email);
    const boardingStation     = safeText(booking?.boardingStationName, "Boarding");
    const destinationStation  = safeText(booking?.destinationStationName, "Destination");
    const trainName           = safeText(booking?.journeySnapshot?.trainName, "Train Service");
    const trainNo             = safeText(booking?.journeySnapshot?.trainNo);
    const departureTime       = formatTime(booking?.journeySnapshot?.departureTime || "");
    const arrivalTime         = formatTime(booking?.journeySnapshot?.arrivalTime || "");
    const durationLabel       = safeText(booking?.journeySnapshot?.durationLabel);
    const travelDate          = formatTravelDate(booking?.travelDate || "");
    const paidAt              = formatDate(booking?.paidAt || booking?.updatedAt);
    const seats               = Number(booking?.seats || 1);
    const farePerSeat         = formatMoney(booking?.journeySnapshot?.farePerSeatLkr || 0);
    const totalFare           = formatMoney(booking?.totalFareLkr || 0);

    // ── Logo + Title header ────────────────────────────────────────────────
    const logoX = frameX + 28;
    const logoY = frameY + 22;
    const logoPath = tryResolveLogoPath();

    if (logoPath) {
      doc.image(logoPath, logoX, logoY, { fit: [90, 90], align: "left", valign: "top" });
    } else {
      // Simple text fallback if JPEG not found
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#1D4ED8").text("DropMe", logoX, logoY + 20);
      doc.font("Helvetica").fontSize(10).fillColor("#6B7280").text("Rail", logoX + 4, logoY + 46);
    }

    // "DropMe Train Ticket" title — centred in the remaining width
    const titleX = logoX + 45;
    const titleY = frameY + 58;
    doc
      .font("Helvetica")
      .fontSize(28)
      .fillColor("#000000")
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
        .strokeColor("#AAAAAA")
        .moveTo(dividerL, y)
        .lineTo(dividerR, y)
        .stroke()
        .restore();
    }

  // ── Route section ──────────────────────────────────────────────────────
// Change from 3 columns to 2 columns
const routeY   = frameY + 150;
const colW     = frameW / 2;
const colLeft  = frameX;
const colRight = frameX + colW;

// "Booked from" label
doc
  .font("Helvetica-Bold")
  .fontSize(11)
  .fillColor("#333333")
  .text("Booked from", colLeft, routeY, { width: colW, align: "center" });

// "To" label
doc
  .font("Helvetica-Bold")
  .fontSize(11)
  .fillColor("#333333")
  .text("To", colRight, routeY, { width: colW, align: "center" });

// Station names
const stationY = routeY + 22;

doc
  .font("Helvetica")
  .fontSize(26)
  .fillColor("#000000")
  .text(boardingStation, colLeft, stationY, { width: colW, align: "center" });

doc
  .font("Helvetica")
  .fontSize(26)
  .fillColor("#000000")
  .text(destinationStation, colRight, stationY, { width: colW, align: "center" });

// Divider below route
hLine(routeY + 74);

    // ── Passenger + Train ──────────────────────────────────────────────────
    const sec1Y   = routeY + 94;       // section title Y
    const sec1ValY = sec1Y + 28;       // values start Y
    const leftCol  = frameX + 28;
const rightCol = frameX + frameW / 2 + 38; // move right sections more to the right
const colValW  = frameW / 2 - 78;          // slightly reduce right/left block width

    // Section titles
    doc.font("Helvetica").fontSize(16).fillColor("#111111")
       .text("Passenger Details", leftCol, sec1Y);
    doc.font("Helvetica").fontSize(16).fillColor("#111111")
       .text("Train Details", rightCol, sec1Y);

    // Values
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
        doc.font("Helvetica").fontSize(11.5).fillColor("#333333")
           .text(line, x, y, { width, align: "left", lineBreak: false });
        y += 18;
      }
      return y;
    }

    drawLines(passengerLines, leftCol, sec1ValY, colValW);
    drawLines(trainLines, rightCol, sec1ValY, colValW);

    // Divider below passenger/train section
    hLine(sec1ValY + 56);

    // ── Journey + Fare ─────────────────────────────────────────────────────
    const sec2Y    = sec1ValY + 74;
    const sec2ValY = sec2Y + 28;

    doc.font("Helvetica").fontSize(16).fillColor("#111111")
       .text("Journey Details", leftCol, sec2Y);
    doc.font("Helvetica").fontSize(16).fillColor("#111111")
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

    // Divider below journey/fare section
    hLine(sec2ValY + 88);

    // ── Ticket number box ──────────────────────────────────────────────────
    const boxW  = 280;
    const boxH  = 64;
    const boxX  = (pageWidth - boxW) / 2;
    const boxY  = sec2ValY + 108;

    doc
      .save()
      .lineWidth(1.5)
      .strokeColor("#222222")
      .roundedRect(boxX, boxY, boxW, boxH, 14)
      .stroke()
      .restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#000000")
      .text(`Ticket No: ${ticketNumber}`, boxX, boxY + 20, {
        width: boxW,
        align: "center",
      });

    // ── Footer ─────────────────────────────────────────────────────────────
    const footerY = frameY + frameH - 32;
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#888888")
      .text(
        "Please carry this ticket during your journey. Thank you for using DropMe Rail.",
        frameX,
        footerY,
        { width: frameW, align: "center" }
      );

    doc.end();
  });
}
