import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function createBooking(req, res, next) {
  try {
    const offerId = req.params.id;
    const seatsBooked = Number(req.body?.seatsBooked || 1);

    if (!Number.isFinite(seatsBooked) || seatsBooked < 1 || seatsBooked > 6) {
      throw new HttpError(400, "Invalid seatsBooked");
    }

    const offer = await RideOffer.findOneAndUpdate(
      { _id: offerId, status: "open", seatsAvailable: { $gte: seatsBooked } },
      { $inc: { seatsAvailable: -seatsBooked } },
      { new: true }
    );

    if (!offer) throw new HttpError(409, "Not enough seats or offer not available");

    let booking;
    try {
      booking = await RideBooking.create({
        offerId: offer._id,
        riderId: req.user.sub,
        driverId: offer.driverId,
        seatsBooked,
        status: "pending",
      });
    } catch (e) {
      await RideOffer.updateOne({ _id: offer._id }, { $inc: { seatsAvailable: seatsBooked } });

      if (e?.code === 11000) throw new HttpError(409, "You already booked this offer.");

      throw e;
    }

    req.io?.to(`driver:${String(offer.driverId)}`).emit("booking:new", {
      bookingId: String(booking._id),
      offerId: String(offer._id),
      seatsBooked,
    });

    res.status(201).json({ ok: true, booking, offer });
  } catch (err) {
    next(err);
  }
}

export async function myBookings(req, res, next) {
  try {
    const bookings = await RideBooking.find({ riderId: req.user.sub })
      .populate("offerId")
      .sort({ createdAt: -1 });

    res.json({ ok: true, bookings });
  } catch (err) {
    next(err);
  }
}

export async function offerBookings(req, res, next) {
  try {
    const offer = await RideOffer.findById(req.params.id);
    if (!offer) throw new HttpError(404, "Offer not found");

    const isOwner = String(offer.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    const bookings = await RideBooking.find({ offerId: offer._id }).sort({ createdAt: -1 });
    res.json({ ok: true, bookings });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const booking = await RideBooking.findById(req.params.bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const offer = await RideOffer.findById(booking.offerId);
    if (!offer) throw new HttpError(404, "Offer not found");

    const isOwner = String(offer.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.status !== "pending") {
      throw new HttpError(400, `Cannot change status from ${booking.status}`);
    }

    const nextStatus = String(req.body?.status || "");
    if (!["confirmed", "rejected"].includes(nextStatus)) {
      throw new HttpError(400, "Invalid status");
    }

    if (nextStatus === "rejected") {
      await RideOffer.updateOne(
        { _id: offer._id },
        { $inc: { seatsAvailable: booking.seatsBooked } }
      );
    }

    booking.status = nextStatus;
    await booking.save();

    req.io?.to(`rider:${String(booking.riderId)}`).emit("booking:status", {
      bookingId: String(booking._id),
      status: booking.status,
    });

    res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await RideBooking.findById(req.params.bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const isOwner = String(booking.riderId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.status === "pending" && booking.paymentStatus === "unpaid") {
      booking.status = "cancelled";
      await booking.save();
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function loadImageBuffer(src) {
  try {
    if (!src || typeof src !== "string") return null;

    if (src.startsWith("data:image/")) {
      const base64 = src.split(",")[1];
      return base64 ? Buffer.from(base64, "base64") : null;
    }

    if (src.startsWith("http://") || src.startsWith("https://")) {
      const response = await fetch(src);
      if (!response.ok) return null;
      const arr = await response.arrayBuffer();
      return Buffer.from(arr);
    }

    return null;
  } catch {
    return null;
  }
}

function drawRoundedBox(doc, x, y, w, h, radius = 16, fill = "#111111", stroke = "#2a2a2a") {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fillAndStroke(fill, stroke);
  doc.restore();
}

function fitText(doc, text, x, y, w, options = {}) {
  doc.text(text ?? "-", x, y, {
    width: w,
    ...options,
  });
}

export async function downloadReceipt(req, res, next) {
  try {
    const bookingId = req.params.bookingId;

    const booking = await RideBooking.findById(bookingId)
      .populate({
        path: "offerId",
        select:
          "origin destination pickupTime priceLkr driverSnapshot vehicleSnapshot seatsTotal seatsAvailable",
      })
      .lean();

    if (!booking) throw new HttpError(404, "Booking not found");

    const isRider = String(booking.riderId) === String(req.user.sub);
    const isDriver = String(booking.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";

    if (!isRider && !isDriver && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.status !== "confirmed" && booking.paymentStatus !== "paid") {
      throw new HttpError(400, "Receipt available only after payment/confirmation");
    }

    const offer = booking.offerId || null;

    const origin = offer?.origin?.address || booking?.offerSnapshot?.originAddress || "—";
    const destination = offer?.destination?.address || booking?.offerSnapshot?.destinationAddress || "—";

    const pickupTime = offer?.pickupTime
      ? new Date(offer.pickupTime).toLocaleString()
      : booking?.offerSnapshot?.pickupTime
      ? new Date(booking.offerSnapshot.pickupTime).toLocaleString()
      : "—";

    const driverName = offer?.driverSnapshot?.name || booking?.offerSnapshot?.driverName || "—";
    const driverEmail = offer?.driverSnapshot?.email || booking?.offerSnapshot?.driverEmail || "—";
    const driverPhotoUrl =
      offer?.driverSnapshot?.photoUrl ||
      booking?.offerSnapshot?.driverPhotoUrl ||
      booking?.driverPhotoUrl ||
      "";

    const vehicleType = offer?.vehicleSnapshot?.type || booking?.offerSnapshot?.vehicleType || "—";
    const vehicleNumber =
      offer?.vehicleSnapshot?.number || booking?.offerSnapshot?.vehicleNumber || "—";
    const vehicleColor = offer?.vehicleSnapshot?.color || booking?.offerSnapshot?.vehicleColor || "—";
    const vehiclePhotoUrl =
      offer?.vehicleSnapshot?.photoUrl ||
      booking?.offerSnapshot?.vehiclePhotoUrl ||
      booking?.vehiclePhotoUrl ||
      "";

    const paymentStatus = booking.paymentStatus || booking.status || "—";
    const amount = Number(booking.amount ?? 0);
    const currency = (booking.currency || "lkr").toUpperCase();
    const paidAt = booking.paidAt ? new Date(booking.paidAt).toLocaleString() : "—";
    const seatsBooked = Number(booking.seatsBooked || 1);
    const unitPrice = Number(booking?.offerSnapshot?.priceLkr || offer?.priceLkr || 0);

    const routeDistanceText =
      booking?.routeDistanceText ||
      (Number.isFinite(Number(booking?.routeDistanceKm)) && Number(booking.routeDistanceKm) > 0
        ? `${Number(booking.routeDistanceKm).toFixed(1)} km`
        : "—");

    const issuedAt = new Date().toLocaleString();

    const qrText = [
      "DropMe Booking Receipt",
      `Receipt ID: ${bookingId}`,
      `Route: ${origin} -> ${destination}`,
      `Pickup: ${pickupTime}`,
      `Seats: ${seatsBooked}`,
      `Total: ${currency} ${amount.toLocaleString()}`,
      `Payment: ${paymentStatus}`,
    ].join("\n");

    const qrDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 220,
      color: {
        dark: "#FFFFFF",
        light: "#000000",
      },
    });

    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const driverImageBuffer = await loadImageBuffer(driverPhotoUrl);
    const vehicleImageBuffer = await loadImageBuffer(vehiclePhotoUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="DropMe-Receipt-${bookingId}.pdf"`);

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: false,
    });

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.rect(0, 0, pageWidth, pageHeight).fill("#000000");

    const x = 24;
    const y = 24;
    const w = pageWidth - 48;
    const h = pageHeight - 48;

    drawRoundedBox(doc, x, y, w, h, 24, "#050505", "#1f1f1f");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24);
    doc.text("DropMe Receipt", x + 24, y + 18);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Smart ride booking confirmation", x + 24, y + 48);

    doc.save();
    doc.roundedRect(x + w - 145, y + 20, 110, 24, 12).fill("#111111");
    doc.restore();
    doc.fillColor("#86EFAC").font("Helvetica-Bold").fontSize(10);
    doc.text(String(paymentStatus).toUpperCase(), x + w - 132, y + 28, {
      width: 84,
      align: "center",
    });

    drawRoundedBox(doc, x + 20, y + 76, w - 40, 84, 18, "#0d0d0d", "#262626");

    doc.fillColor("#6B7280").font("Helvetica").fontSize(10);
    doc.text("TRIP ROUTE", x + 36, y + 92);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15);
    doc.text(origin, x + 36, y + 112, { width: 200 });

    doc.fillColor("#9CA3AF").font("Helvetica-Bold").fontSize(18);
    doc.text("→", x + 242, y + 112);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15);
    doc.text(destination, x + 270, y + 112, { width: 230 });

    drawRoundedBox(doc, x + 20, y + 178, 330, 194, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Booking Summary", x + 36, y + 196);

    const rows = [
      ["Receipt ID", bookingId],
      ["Issued", issuedAt],
      ["Pickup", pickupTime],
      ["Distance", routeDistanceText],
      ["Seats", String(seatsBooked)],
      ["Per Ticket", `${currency} ${unitPrice.toLocaleString()}`],
      ["Total", `${currency} ${amount.toLocaleString()}`],
      ["Paid At", paidAt],
    ];

    let rowY = y + 226;
    for (const [label, value] of rows) {
      doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
      doc.text(label, x + 36, rowY);

      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
      fitText(doc, value, x + 162, rowY, 155);

      rowY += 21;
    }

    drawRoundedBox(doc, x + 366, y + 178, 170, 194, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("QR Verify", x + 418, y + 196, { width: 70, align: "center" });

    doc.image(qrBuffer, x + 392, y + 224, {
      fit: [118, 118],
      align: "center",
      valign: "center",
    });

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(8);
    doc.text("Scan for booking details", x + 390, y + 348, {
      width: 122,
      align: "center",
    });

    drawRoundedBox(doc, x + 20, y + 390, 250, 132, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Driver Details", x + 36, y + 408);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Name", x + 36, y + 438);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, driverName, x + 86, y + 438, 90);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Email", x + 36, y + 460);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, driverEmail, x + 86, y + 460, 90);

    if (driverImageBuffer) {
      doc.save();
      doc.roundedRect(x + 176, y + 426, 70, 78, 12).clip();
      doc.image(driverImageBuffer, x + 176, y + 426, {
        fit: [70, 78],
        align: "center",
        valign: "center",
      });
      doc.restore();
      doc.roundedRect(x + 176, y + 426, 70, 78, 12).stroke("#2a2a2a");
    } else {
      doc.save();
      doc.roundedRect(x + 176, y + 426, 70, 78, 12).fill("#121212");
      doc.restore();
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      doc.text("No Image", x + 191, y + 463);
    }

    drawRoundedBox(doc, x + 286, y + 390, 250, 132, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Vehicle Details", x + 302, y + 408);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Type", x + 302, y + 434);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleType, x + 360, y + 434, 88);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Number", x + 302, y + 456);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleNumber, x + 360, y + 456, 88);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Color", x + 302, y + 478);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleColor, x + 360, y + 478, 88);

    if (vehicleImageBuffer) {
      doc.save();
      doc.roundedRect(x + 454, y + 424, 66, 82, 12).clip();
      doc.image(vehicleImageBuffer, x + 454, y + 424, {
        fit: [66, 82],
        align: "center",
        valign: "center",
      });
      doc.restore();
      doc.roundedRect(x + 454, y + 424, 66, 82, 12).stroke("#2a2a2a");
    } else {
      doc.save();
      doc.roundedRect(x + 454, y + 424, 66, 82, 12).fill("#121212");
      doc.restore();
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      doc.text("No Image", x + 468, y + 462);
    }

    doc.fillColor("#6B7280").font("Helvetica").fontSize(9);
    doc.text(
      "Thank you for using DropMe. Please keep this receipt for your travel records.",
      x + 20,
      y + h - 28,
      {
        width: w - 40,
        align: "center",
      }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
}