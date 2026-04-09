import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

function shortLabel(label = "") {
  return String(label).split(",")[0].trim();
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

function drawRoundedRect(doc, x, y, w, h, r, fillColor, strokeColor = null, lineWidth = 1) {
  doc.save();

  if (fillColor) doc.fillColor(fillColor);
  if (strokeColor) {
    doc.strokeColor(strokeColor);
    doc.lineWidth(lineWidth);
  }

  doc.roundedRect(x, y, w, h, r);

  if (fillColor && strokeColor) {
    doc.fillAndStroke();
  } else if (fillColor) {
    doc.fill();
  } else if (strokeColor) {
    doc.stroke();
  }

  doc.restore();
}

function drawInfoItem(doc, { x, y, w, h = 62, label, value, mono = false }) {
  drawRoundedRect(doc, x, y, w, h, 16, "#0B101A", "#1D2635", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#BFC8D8")
    .text(String(label || "").toUpperCase(), x + 14, y + 11, {
      width: w - 28,
      lineBreak: false,
    });

  doc
    .font(mono ? "Courier-Bold" : "Helvetica-Bold")
    .fontSize(mono ? 10.5 : 13)
    .fillColor("#F2F5FF")
    .text(value || "-", x + 14, y + 28, {
      width: w - 28,
      ellipsis: true,
    });
}

function drawMiniRow(doc, { x, y, w, label, value }) {
  drawRoundedRect(doc, x, y, w, 46, 14, "#0E131E", "#232C3D", 1);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9FAEC7")
    .text(label || "-", x + 12, y + 9, {
      width: 120,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#FFFFFF")
    .text(value || "-", x + 128, y + 9, {
      width: w - 140,
      align: "right",
      ellipsis: true,
    });
}

function drawMetricCard(doc, { x, y, w, label, value }) {
  drawRoundedRect(doc, x, y, w, 56, 14, "#0A0E16", "#252E3F", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#98A9C4")
    .text(String(label || "").toUpperCase(), x + 12, y + 10, {
      width: w - 24,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#F5E7C8")
    .text(value || "-", x + 12, y + 25, {
      width: w - 24,
      ellipsis: true,
    });
}

function drawStatusBadge(doc, { x, y, text, fill, stroke, color }) {
  const width = Math.max(150, Math.min(260, 24 + String(text || "").length * 6.2));

  drawRoundedRect(doc, x, y, width, 26, 13, fill, stroke, 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(color)
    .text(text, x + 12, y + 8, {
      width: width - 24,
      lineBreak: false,
    });

  return width;
}

function drawStopCard(doc, { x, y, w, title, time }) {
  doc.save();
  doc.lineWidth(1).fillColor("#0F1420").strokeColor("#FFCD7E40");
  doc.circle(x + 10, y + 12, 9).fillAndStroke();
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#FFFFFF")
    .text(title || "-", x + 28, y + 2, {
      width: w - 28,
      ellipsis: true,
    });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#B9C7E0")
    .text(time || "-", x + 28, y + 19, {
      width: w - 28,
      ellipsis: true,
    });
}

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

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  const bookingId = booking?._id ? String(booking._id) : "-";
  const travelDate = booking?.travelDate || "-";
  const busNo = booking?.journeySnapshot?.busNumber || "-";
  const routeNo = booking?.journeySnapshot?.routeNumber || "-";
  const busRoute = booking?.journeySnapshot?.routeLabel || "-";
  const pickupName = shortLabel(booking?.pickupStop?.label);
  const dropoffName = shortLabel(booking?.dropoffStop?.label);
  const pickupTime = booking?.pickupStop?.time || "Time not available";
  const dropoffTime = booking?.dropoffStop?.time || "Time not available";
  const passengerName =
    booking?.passengerSnapshot?.name ||
    booking?.passengerSnapshot?.fullName ||
    "-";
  const passengerEmail = booking?.passengerSnapshot?.email || "-";
  const seatText = Array.isArray(booking?.seatNumbers)
    ? booking.seatNumbers.join(" & ")
    : "-";
  const seatCount = Array.isArray(booking?.seatNumbers)
    ? booking.seatNumbers.length
    : 0;
  const totalAmount = formatLkr(booking?.totalAmountLkr);
  const farePerSeat = formatLkr(booking?.farePerSeatLkr);
  const distanceText = `${Number(
    booking?.journeySnapshot?.passengerDistanceKm || 0
  ).toFixed(1)} km`;

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
    color: {
      dark: "#003B6F",
      light: "#FFFFFF",
    },
  });

  doc.rect(0, 0, pageW, pageH).fill("#05080F");

  const cardX = 26;
  const cardY = 22;
  const cardW = pageW - 52;
  const cardH = pageH - 44;

  drawRoundedRect(doc, cardX, cardY, cardW, cardH, 28, "#0C1018", "#2B2112", 1);

  // Header
  drawRoundedRect(doc, cardX, cardY, cardW, 74, 28, "#070B12", "#5C4418", 1);

  const logoPath = getLogoPath();
  const logoX = cardX + 18;
  const logoY = cardY + 14;

  drawRoundedRect(doc, logoX, logoY, 46, 46, 14, "#FFFFFF");

  if (logoPath) {
    try {
      doc.image(logoPath, logoX + 4, logoY + 4, {
        width: 38,
        height: 38,
      });
    } catch {
      // ignore logo error
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#F8E8C7")
    .text("DropMe", logoX + 58, cardY + 19);

  drawRoundedRect(doc, logoX + 146, cardY + 20, 64, 20, 10, "#2A2111");
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#FFD966")
    .text("e-ticket", logoX + 162, cardY + 27);

  drawRoundedRect(doc, cardX + cardW - 116, cardY + 20, 92, 24, 12, "#20170B", "#7A5A22", 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#FFDE9C")
    .text("QR secure", cardX + cardW - 98, cardY + 27, {
      width: 56,
      align: "center",
    });

  let y = cardY + 88;

  // Success banner
  drawRoundedRect(doc, cardX + 18, y, cardW - 36, 40, 14, "#0F261B", "#2E7D5E", 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#D7FFE4")
    .text(
      `Payment successful. Bus ticket confirmed. (${totalAmount} paid)`,
      cardX + 30,
      y + 14,
      { width: cardW - 60 }
    );

  y += 54;

  // top grid
  const gridGap = 12;
  const boxW = (cardW - 36 - gridGap * 2) / 3;
  const row1Y = y;

  drawInfoItem(doc, {
    x: cardX + 18,
    y: row1Y,
    w: boxW,
    label: "Booking ID",
    value: bookingId,
    mono: true,
  });

  drawInfoItem(doc, {
    x: cardX + 18 + boxW + gridGap,
    y: row1Y,
    w: boxW,
    label: "Travel Date",
    value: travelDate,
  });

  drawInfoItem(doc, {
    x: cardX + 18 + (boxW + gridGap) * 2,
    y: row1Y,
    w: boxW,
    label: "Bus No",
    value: busNo,
  });

  const row2Y = row1Y + 74;

  drawInfoItem(doc, {
    x: cardX + 18,
    y: row2Y,
    w: boxW,
    label: "Route No",
    value: routeNo,
  });

  drawInfoItem(doc, {
    x: cardX + 18 + boxW + gridGap,
    y: row2Y,
    w: boxW,
    label: "Bus Route",
    value: busRoute,
  });

  drawInfoItem(doc, {
    x: cardX + 18 + (boxW + gridGap) * 2,
    y: row2Y,
    w: boxW,
    label: "Distance",
    value: distanceText,
  });

  y = row2Y + 78;

  // journey + passenger
  const leftW = (cardW - 36 - 14) * 0.54;
  const rightW = cardW - 36 - 14 - leftW;
  const leftX = cardX + 18;
  const rightX = leftX + leftW + 14;
  const blockH = 142;

  drawRoundedRect(doc, leftX, y, leftW, blockH, 20, "#0A0F1A", "#5A4520", 1);

  drawStopCard(doc, {
    x: leftX + 16,
    y: y + 16,
    w: leftW - 32,
    title: `${pickupName} · Pickup point`,
    time: pickupTime,
  });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#D5B57A")
    .text(`Journey via route ${routeNo}`, leftX + 16, y + 66, {
      width: leftW - 32,
      ellipsis: true,
    });

  drawStopCard(doc, {
    x: leftX + 16,
    y: y + 86,
    w: leftW - 32,
    title: `${dropoffName} · Dropoff`,
    time: dropoffTime,
  });

  drawRoundedRect(doc, rightX, y, rightW, blockH, 20, "#0A0E16", "#252E3F", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#AAB8D0")
    .text("PASSENGER DETAILS", rightX + 16, y + 14);

  drawMiniRow(doc, {
    x: rightX + 14,
    y: y + 36,
    w: rightW - 28,
    label: "Passenger Name",
    value: passengerName,
  });

  drawMiniRow(doc, {
    x: rightX + 14,
    y: y + 88,
    w: rightW - 28,
    label: "Passenger Email",
    value: passengerEmail,
  });

  y += blockH + 16;

  // seats + total
  const bottomLeftW = (cardW - 36 - 14) * 0.58;
  const bottomRightW = cardW - 36 - 14 - bottomLeftW;
  const bottomLeftX = cardX + 18;
  const bottomRightX = bottomLeftX + bottomLeftW + 14;

  drawRoundedRect(doc, bottomLeftX, y, bottomLeftW, 72, 18, "#0A0E16", "#252E3F", 1);
  drawRoundedRect(doc, bottomLeftX + 14, y + 18, 160, 30, 15, "#1E2A3A");

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#FFDD99")
    .text(`Seats ${seatText}`, bottomLeftX + 28, y + 28);

  drawMetricCard(doc, {
    x: bottomLeftX + 192,
    y: y + 8,
    w: 110,
    label: "Journey",
    value: distanceText,
  });

  drawMetricCard(doc, {
    x: bottomLeftX + 314,
    y: y + 8,
    w: Math.max(108, bottomLeftW - 328),
    label: "Fare / Seat",
    value: farePerSeat,
  });

  drawRoundedRect(doc, bottomRightX, y, bottomRightW, 72, 18, "#00000099", "#6C5122", 1);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#FFDEAE")
    .text(
      `Total (${seatCount} seat${seatCount === 1 ? "" : "s"})`,
      bottomRightX + 16,
      y + 14
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor("#F6E4B4")
    .text(totalAmount, bottomRightX + 16, y + 32, {
      width: bottomRightW - 32,
      ellipsis: true,
    });

  y += 88;

  // badges
  const badge1Width = drawStatusBadge(doc, {
    x: cardX + 18,
    y,
    text: `Booking Status : ${booking?.bookingStatus || "-"}`,
    fill: "#20273D",
    stroke: "#FFCD7E",
    color: "#FFD966",
  });

  drawStatusBadge(doc, {
    x: cardX + 30 + badge1Width,
    y,
    text: `Payment Status : ${booking?.paymentStatus || "-"}`,
    fill: "#1C3B2A",
    stroke: "#2E7D5E",
    color: "#B2F0C4",
  });

  y += 42;

  // qr block
  drawRoundedRect(doc, cardX + 18, y, cardW - 36, 132, 18, null, "#3C2F17", 1);

  drawRoundedRect(doc, cardX + 36, y + 18, 100, 100, 20, "#FFFFFF");
  doc.image(qrDataUrl, cardX + 46, y + 28, {
    width: 80,
    height: 80,
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#FFDEAE")
    .text("Scan QR with DropMe app", cardX + 156, y + 30);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#B2C3DF")
    .text(
      "Show this digital ticket while boarding. PDF copy accepted.",
      cardX + 156,
      y + 50,
      { width: cardW - 192 }
    );

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#B2C3DF")
    .text(`Reserved seats: ${seatText}`, cardX + 156, y + 74, {
      width: cardW - 192,
    });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#B2C3DF")
    .text(`Bus No: ${busNo} | Route No: ${routeNo}`, cardX + 156, y + 92, {
      width: cardW - 192,
    });

  // footer
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#AEBFDA")
    .text("e-ticket • valid with ID proof", cardX + 20, cardY + cardH - 20);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#AEBFDA")
    .text("DropMe support 24/7", cardX + cardW / 2 - 42, cardY + cardH - 20);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#AEBFDA")
    .text("digital copy accepted", cardX + cardW - 116, cardY + cardH - 20);

  doc.end();
  return done;
}