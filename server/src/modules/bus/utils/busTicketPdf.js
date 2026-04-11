import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
}

function shortRouteLabel(routeLabel = "") {
  const value = String(routeLabel || "").trim();
  if (!value) return "-";
  const parts = value
    .split(/\s*(?:→|->)\s*/g)
    .map((part) => shortLabel(part))
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} -> ${parts[1]}`;
  return shortLabel(value);
}

function formatLkr(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function getLogoPath() {
  const candidates = [
    path.resolve(process.cwd(), "uploads", "dropme-logo.jpeg"),
    path.resolve(process.cwd(), "server", "uploads", "dropme-logo.jpeg"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

// ─── Drawing primitives ───────────────────────────────────────────────────────

function drawRoundedRect(doc, x, y, w, h, r, fillColor, strokeColor = null, lineWidth = 1) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor);
  if (strokeColor) {
    doc.strokeColor(strokeColor);
    doc.lineWidth(lineWidth);
  }
  doc.roundedRect(x, y, w, h, r);
  if (fillColor && strokeColor) doc.fillAndStroke();
  else if (fillColor) doc.fill();
  else if (strokeColor) doc.stroke();
  doc.restore();
}

// ─── Component: Info Card (top grid) ─────────────────────────────────────────
//   label on top, value below — fixed height, full border

function drawInfoItem(doc, { x, y, w, h = 64, label, value, mono = false }) {
  drawRoundedRect(doc, x, y, w, h, 14, "#0B101A", "#1D2635", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#8A9BB8")
    .text(String(label || "").toUpperCase(), x + 14, y + 12, {
      width: w - 28,
      lineBreak: false,
    });

  doc
    .font(mono ? "Courier-Bold" : "Helvetica-Bold")
    .fontSize(mono ? 10 : 13)
    .fillColor("#F2F5FF")
    .text(value || "-", x + 14, y + 30, {
      width: w - 28,
      ellipsis: true,
      lineBreak: false,
    });
}

// ─── Component: Mini Row (passenger details) ──────────────────────────────────

function drawMiniRow(doc, { x, y, w, label, value }) {
  drawRoundedRect(doc, x, y, w, 44, 12, "#0E131E", "#232C3D", 1);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#9FAEC7")
    .text(label || "-", x + 12, y + 10, {
      width: w / 2,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#FFFFFF")
    .text(value || "-", x + 12, y + 24, {
      width: w - 24,
      ellipsis: true,
      lineBreak: false,
    });
}

// ─── Component: Metric Card (distance / fare per seat) ───────────────────────

function drawMetricCard(doc, { x, y, w, h = 54, label, value }) {
  drawRoundedRect(doc, x, y, w, h, 12, "#0A0E16", "#252E3F", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#8899B8")
    .text(String(label || "").toUpperCase(), x + 12, y + 10, {
      width: w - 24,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#F5E7C8")
    .text(value || "-", x + 12, y + 26, {
      width: w - 24,
      ellipsis: true,
      lineBreak: false,
    });
}

// ─── Component: Status Badge ──────────────────────────────────────────────────

function drawStatusBadge(doc, { x, y, text, fill, stroke, color }) {
  const badgeW = Math.max(160, Math.min(270, 26 + String(text || "").length * 6.4));
  drawRoundedRect(doc, x, y, badgeW, 26, 13, fill, stroke, 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(color)
    .text(text, x + 14, y + 9, { width: badgeW - 28, lineBreak: false });
  return badgeW;
}

// ─── Component: Stop Card (pickup / dropoff) ──────────────────────────────────

function drawStopDot(doc, cx, cy) {
  doc.save();
  doc.circle(cx, cy, 8).fillColor("#1A2234").strokeColor("#FFCD7E50").lineWidth(1).fillAndStroke();
  doc.restore();
}

function drawStopCard(doc, { x, y, w, title, time }) {
  drawStopDot(doc, x + 9, y + 12);
  doc
    .font("Helvetica-Bold")
    .fontSize(12.5)
    .fillColor("#FFFFFF")
    .text(title || "-", x + 26, y + 2, { width: w - 26, ellipsis: true, lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#B9C7E0")
    .text(time || "-", x + 26, y + 19, { width: w - 26, ellipsis: true, lineBreak: false });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBusTicketPdfBuffer(booking) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `DropMe Bus Ticket - ${booking?._id || "ticket"}`,
      Author: "DropMe",
      Subject: "Bus e-ticket",
    },
  });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // ── Page geometry ──
  const pageW = doc.page.width;   // 595.28
  const pageH = doc.page.height;  // 841.89

  // ── Data extraction ──
  const bookingId     = booking?._id ? String(booking._id) : "-";
  const travelDate    = booking?.travelDate || "-";
  const busNo         = booking?.journeySnapshot?.busNumber || "-";
  const routeNo       = booking?.journeySnapshot?.routeNumber || "-";
  const busRoute      = shortRouteLabel(booking?.journeySnapshot?.routeLabel);
  const pickupName    = shortLabel(booking?.pickupStop?.label);
  const dropoffName   = shortLabel(booking?.dropoffStop?.label);
  const pickupTime    = booking?.pickupStop?.time  || "Time not available";
  const dropoffTime   = booking?.dropoffStop?.time || "Time not available";
  const passengerName =
    booking?.passengerSnapshot?.name ||
    booking?.passengerSnapshot?.fullName ||
    "-";
  const passengerEmail = booking?.passengerSnapshot?.email || "-";
  const seatText  = Array.isArray(booking?.seatNumbers) ? booking.seatNumbers.join(" & ") : "-";
  const seatCount = Array.isArray(booking?.seatNumbers) ? booking.seatNumbers.length : 0;
  const totalAmount  = formatLkr(booking?.totalAmountLkr);
  const farePerSeat  = formatLkr(booking?.farePerSeatLkr);
  const distanceText = `${Number(booking?.journeySnapshot?.passengerDistanceKm || 0).toFixed(1)} km`;

  // ── QR code ──
  const qrPayload = [
    "DropMe Bus Ticket",
    `Booking ID: ${bookingId}`,
    `Passenger: ${passengerName}`,
    `Passenger Email: ${passengerEmail}`,
    `Travel Date: ${travelDate}`,
    `Bus No: ${busNo}`,
    `Route No: ${routeNo}`,
    `Bus Route: ${busRoute}`,
    `Pickup: ${pickupName} ${pickupTime}`,
    `Dropoff: ${dropoffName} ${dropoffTime}`,
    `Seats: ${seatText}`,
    `Total: ${totalAmount}`,
    `Booking Status: ${booking?.bookingStatus || "-"}`,
    `Payment Status: ${booking?.paymentStatus || "-"}`,
  ].join("\n");

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 160,
    color: { dark: "#003B6F", light: "#FFFFFF" },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LAYOUT CONSTANTS
  // ══════════════════════════════════════════════════════════════════════════
  const OUTER_PAD = 26;           // page edge → card edge
  const INNER_PAD = 18;           // card edge → content edge
  const GAP       = 10;           // standard inter-element gap
  const COL_GAP   = 10;           // gap between columns

  const cardX = OUTER_PAD;
  const cardY = OUTER_PAD;
  const cardW = pageW - OUTER_PAD * 2;   // ≈ 543
  const cardH = pageH - OUTER_PAD * 2;  // ≈ 790

  const contentX = cardX + INNER_PAD;
  const contentW = cardW - INNER_PAD * 2;

  // ─── Page background ───────────────────────────────────────────────────────
  doc.rect(0, 0, pageW, pageH).fill("#05080F");

  // ─── Card background ──────────────────────────────────────────────────────
  drawRoundedRect(doc, cardX, cardY, cardW, cardH, 24, "#0C1018", "#2B2112", 1);

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER  (height: 70)
  // ══════════════════════════════════════════════════════════════════════════
  const HEADER_H = 70;
  drawRoundedRect(doc, cardX, cardY, cardW, HEADER_H, 24, "#070B12", "#5C4418", 1);

  const logoBoxX = contentX;
  const logoBoxY = cardY + 12;
  const logoBoxSz = 46;

  // Logo white background pill
  drawRoundedRect(doc, logoBoxX, logoBoxY, logoBoxSz, logoBoxSz, 13, "#FFFFFF");

  const logoPath = getLogoPath();
  if (logoPath) {
    try {
      doc.image(logoPath, logoBoxX + 4, logoBoxY + 4, { width: 38, height: 38 });
    } catch { /* ignore */ }
  }

  // "DropMe" wordmark
  doc
    .font("Helvetica-Bold")
    .fontSize(23)
    .fillColor("#F8E8C7")
    .text("DropMe", logoBoxX + logoBoxSz + 12, cardY + 22, { lineBreak: false });

  // "e-ticket" chip
  const chipX = logoBoxX + logoBoxSz + 12;
  const chipY = cardY + 47;
  drawRoundedRect(doc, chipX, chipY, 58, 16, 8, "#2A2111");
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#FFD966")
    .text("e-ticket", chipX + 6, chipY + 4, { lineBreak: false });

  // "QR secure" badge (right)
  const qrBadgeW = 90;
  const qrBadgeX = cardX + cardW - INNER_PAD - qrBadgeW;
  drawRoundedRect(doc, qrBadgeX, cardY + 22, qrBadgeW, 22, 11, "#20170B", "#7A5A22", 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor("#FFDE9C")
    .text("QR secure", qrBadgeX, cardY + 28, { width: qrBadgeW, align: "center", lineBreak: false });

  // ══════════════════════════════════════════════════════════════════════════
  // CURSOR — tracks the vertical draw position below the header
  // ══════════════════════════════════════════════════════════════════════════
  let cy = cardY + HEADER_H + GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // SUCCESS BANNER  (height: 36)
  // ══════════════════════════════════════════════════════════════════════════
  const BANNER_H = 36;
  drawRoundedRect(doc, contentX, cy, contentW, BANNER_H, 12, "#0F261B", "#2E7D5E", 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#D7FFE4")
    .text(
      `Payment successful. Bus ticket confirmed. (${totalAmount} paid)`,
      contentX + 14, cy + 11,
      { width: contentW - 28, lineBreak: false, ellipsis: true }
    );

  cy += BANNER_H + GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // INFO GRID — 3 columns × 2 rows  (height: 64 + GAP + 64 = 138)
  // ══════════════════════════════════════════════════════════════════════════
  const INFO_H   = 64;
  const col3W    = (contentW - COL_GAP * 2) / 3;

  const infoRow = [
    { label: "Booking ID",  value: bookingId,  mono: true },
    { label: "Travel Date", value: travelDate },
    { label: "Bus No",      value: busNo },
  ];
  infoRow.forEach((item, i) => {
    drawInfoItem(doc, {
      x: contentX + i * (col3W + COL_GAP),
      y: cy,
      w: col3W,
      h: INFO_H,
      ...item,
    });
  });

  cy += INFO_H + GAP;

  const infoRow2 = [
    { label: "Route No",  value: routeNo },
    { label: "Bus Route", value: busRoute },
    { label: "Distance",  value: distanceText },
  ];
  infoRow2.forEach((item, i) => {
    drawInfoItem(doc, {
      x: contentX + i * (col3W + COL_GAP),
      y: cy,
      w: col3W,
      h: INFO_H,
      ...item,
    });
  });

  cy += INFO_H + GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // JOURNEY + PASSENGER  (height: 150)
  // ══════════════════════════════════════════════════════════════════════════
  const JOURNEY_H    = 150;
  const leftColW     = Math.round(contentW * 0.54);
  const rightColW    = contentW - leftColW - COL_GAP;
  const journeyX     = contentX;
  const passengerX   = contentX + leftColW + COL_GAP;

  // ── Journey block ──
  drawRoundedRect(doc, journeyX, cy, leftColW, JOURNEY_H, 16, "#0A0F1A", "#5A4520", 1);

  drawStopCard(doc, {
    x: journeyX + 16,
    y: cy + 16,
    w: leftColW - 32,
    title: `${pickupName} · Pickup`,
    time: pickupTime,
  });

  // Divider line
  const dividerY = cy + JOURNEY_H / 2;
  doc
    .save()
    .moveTo(journeyX + 24, dividerY)
    .lineTo(journeyX + leftColW - 24, dividerY)
    .strokeColor("#3A3020")
    .lineWidth(0.8)
    .dash(4, { space: 4 })
    .stroke()
    .restore();

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#D5B57A")
    .text(`Journey via route ${routeNo}`, journeyX + 26, dividerY - 9, {
      width: leftColW - 52,
      align: "center",
      lineBreak: false,
    });

  drawStopCard(doc, {
    x: journeyX + 16,
    y: cy + JOURNEY_H - 50,
    w: leftColW - 32,
    title: `${dropoffName} · Dropoff`,
    time: dropoffTime,
  });

  // ── Passenger block ──
  drawRoundedRect(doc, passengerX, cy, rightColW, JOURNEY_H, 16, "#0A0E16", "#252E3F", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor("#6B8AAF")
    .text("PASSENGER DETAILS", passengerX + 14, cy + 14, { lineBreak: false });

  const miniRowW = rightColW - 28;
  drawMiniRow(doc, { x: passengerX + 14, y: cy + 34,  w: miniRowW, label: "Passenger Name",  value: passengerName });
  drawMiniRow(doc, { x: passengerX + 14, y: cy + 92,  w: miniRowW, label: "Passenger Email", value: passengerEmail });

  cy += JOURNEY_H + GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // SEATS + FINANCIALS  (height: 70)
  // ══════════════════════════════════════════════════════════════════════════
  const SEAT_H       = 70;
  const seatBlockW   = Math.round(contentW * 0.65);
  const totalBlockW  = contentW - seatBlockW - COL_GAP;
  const seatBlockX   = contentX;
  const totalBlockX  = contentX + seatBlockW + COL_GAP;

  // ── Seat block ──
  drawRoundedRect(doc, seatBlockX, cy, seatBlockW, SEAT_H, 16, "#0A0E16", "#252E3F", 1);

  // Seat number pill — sized to fit text on one line
  // Fixed widths: metric cards 110px each, seat pill gets the rest
  const metricW   = 110;
  const seatPillW = seatBlockW - 28 - metricW * 2 - COL_GAP * 2;
  const seatLabel = `Seat  ${seatText}`;
  drawRoundedRect(doc, seatBlockX + 14, cy + 8, seatPillW, SEAT_H - 16, 14, "#1E2A3A");
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#FFDD99")
    .text(seatLabel, seatBlockX + 26, cy + 18, {
      width: seatPillW - 24,
      ellipsis: true,

    });

  const metric1X = seatBlockX + 14 + seatPillW + COL_GAP;
  const metric2X = metric1X + metricW + COL_GAP;

  drawMetricCard(doc, { x: metric1X, y: cy + 8, w: metricW, h: SEAT_H - 16, label: "Distance",   value: distanceText });
  drawMetricCard(doc, { x: metric2X, y: cy + 8, w: metricW, h: SEAT_H - 16, label: "Fare / Seat", value: farePerSeat });

  // ── Total block ──
  drawRoundedRect(doc, totalBlockX, cy, totalBlockW, SEAT_H, 16, "#0F2A1A", "#2E7D5E", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#B2F0C4")
    .text(`Total  (${seatCount} seat${seatCount === 1 ? "" : "s"})`, totalBlockX + 16, cy + 10, {
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#D7FFE4")
    .text(totalAmount, totalBlockX + 16, cy + 28, {
      width: totalBlockW - 32,
      ellipsis: true,
      lineBreak: false,
    });

  cy += SEAT_H + GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS BADGES
  // ══════════════════════════════════════════════════════════════════════════
  const badge1W = drawStatusBadge(doc, {
    x: contentX,
    y: cy,
    text: `Booking Status : ${booking?.bookingStatus || "-"}`,
    fill: "#20273D",
    stroke: "#FFCD7E",
    color: "#FFD966",
  });

  drawStatusBadge(doc, {
    x: contentX + badge1W + 10,
    y: cy,
    text: `Payment Status : ${booking?.paymentStatus || "-"}`,
    fill: "#1C3B2A",
    stroke: "#2E7D5E",
    color: "#B2F0C4",
  });

  cy += 36;

  // ══════════════════════════════════════════════════════════════════════════
  // QR BLOCK  — fills remaining space to the footer
  // ══════════════════════════════════════════════════════════════════════════
  const FOOTER_H = 24;
  const QR_H     = cardY + cardH - FOOTER_H - GAP - cy;

  drawRoundedRect(doc, contentX, cy, contentW, QR_H, 16, null, "#3C2F17", 1);

  // QR image
  const qrSize   = QR_H - 20;
  const qrImgX   = contentX + 16;
  const qrImgY   = cy + 10;
  drawRoundedRect(doc, qrImgX, qrImgY, qrSize, qrSize, 14, "#FFFFFF");
  doc.image(qrDataUrl, qrImgX + 6, qrImgY + 6, { width: qrSize - 12, height: qrSize - 12 });

  // QR text block
  const qrTextX = qrImgX + qrSize + 18;
  const qrTextW = contentX + contentW - qrTextX - 10;
  const qrTextY = cy + (QR_H - 80) / 2;  // vertically centred

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#FFDEAE")
    .text("Scan QR with DropMe app", qrTextX, qrTextY, { width: qrTextW });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#B2C3DF")
    .text(
      "Show this digital ticket while boarding.\nPDF copy accepted.",
      qrTextX, qrTextY + 20, { width: qrTextW }
    );

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#B2C3DF")
    .text(`Reserved seats: ${seatText}`, qrTextX, qrTextY + 50, { width: qrTextW, lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#B2C3DF")
    .text(`Bus No: ${busNo}  |  Route No: ${routeNo}`, qrTextX, qrTextY + 66, { width: qrTextW, lineBreak: false });

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  const footerY = cardY + cardH - FOOTER_H + 6;

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#7A8FAD")
    .text("e-ticket • valid with ID proof", contentX, footerY, { lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#7A8FAD")
    .text("DropMe support 24/7", cardX, footerY, { width: cardW, align: "center", lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#7A8FAD")
    .text("digital copy accepted", contentX, footerY, { width: contentW, align: "right", lineBreak: false });

  doc.end();
  return done;
}