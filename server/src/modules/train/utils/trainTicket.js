import PDFDocument from "pdfkit";

function formatDate(value) {
  if (!value) return "—";

  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString();
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

export async function generateTrainTicketPdfBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "DropMe Train Ticket",
        Author: "DropMe",
      },
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ticketNumber = getTrainTicketNumber(booking);
    const passengerName = booking?.passengerSnapshot?.name || "Passenger";
    const passengerEmail = booking?.passengerSnapshot?.email || "—";

    const trainNo = booking?.journeySnapshot?.trainNo || "—";
    const trainName = booking?.journeySnapshot?.trainName || "Train Service";
    const departureTime = formatTime(
      booking?.journeySnapshot?.departureTime || ""
    );
    const arrivalTime = formatTime(
      booking?.journeySnapshot?.arrivalTime || ""
    );
    const durationLabel = booking?.journeySnapshot?.durationLabel || "—";

    const routeLabel = `${booking?.boardingStationName || "Boarding"} → ${
      booking?.destinationStationName || "Destination"
    }`;

    const seats = Number(booking?.seats || 1);
    const farePerSeat = formatMoney(
      booking?.journeySnapshot?.farePerSeatLkr || 0
    );
    const totalFare = formatMoney(booking?.totalFareLkr || 0);

    doc
      .fillColor("#111111")
      .fontSize(24)
      .text("DropMe Train Ticket", { align: "center" });

    doc.moveDown(0.3);

    doc
      .fontSize(11)
      .fillColor("#666666")
      .text(`Ticket No: ${ticketNumber}`, { align: "center" });

    doc.moveDown(1.2);

    doc
      .roundedRect(50, 120, 495, 110, 16)
      .fillAndStroke("#F5F9FF", "#D7E4FF");

    doc
      .fillColor("#111111")
      .fontSize(18)
      .text(routeLabel, 70, 145, { width: 455, align: "center" });

    doc
      .fontSize(11)
      .fillColor("#4B5563")
      .text(
        `${trainName}${trainNo !== "—" ? ` • ${trainNo}` : ""}`,
        70,
        178,
        { width: 455, align: "center" }
      );

    let y = 265;

    doc.fillColor("#111111").fontSize(14).text("Passenger Details", 50, y);
    y += 22;
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Name: ${passengerName}`, 50, y);
    y += 18;
    doc.text(`Email: ${passengerEmail}`, 50, y);

    y += 34;
    doc.fillColor("#111111").fontSize(14).text("Journey Details", 50, y);
    y += 22;
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Travel Date: ${booking?.travelDate || "—"}`, 50, y);
    y += 18;
    doc.text(`Departure Time: ${departureTime}`, 50, y);
    y += 18;
    doc.text(`Arrival Time: ${arrivalTime}`, 50, y);
    y += 18;
    doc.text(`Duration: ${durationLabel}`, 50, y);

    y += 34;
    doc.fillColor("#111111").fontSize(14).text("Fare Details", 50, y);
    y += 22;
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Seats: ${seats}`, 50, y);
    y += 18;
    doc.text(`Fare Per Seat: ${farePerSeat}`, 50, y);
    y += 18;
    doc.text(`Total Fare: ${totalFare}`, 50, y);
    y += 18;
    doc.text(`Payment Reference: ${booking?.paymentReference || "—"}`, 50, y);
    y += 18;
    doc.text(`Paid At: ${formatDate(booking?.paidAt || booking?.updatedAt)}`, 50, y);

    y += 36;
    doc
      .fillColor("#6B7280")
      .fontSize(10)
      .text(
        "Please carry this ticket during your journey. Thank you for using DropMe Rail.",
        50,
        y,
        { width: 495, align: "center" }
      );

    doc.end();
  });
}