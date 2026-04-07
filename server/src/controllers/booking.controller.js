import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { User } from "../models/User.js";
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

    const bookings = await RideBooking.find({ offerId: offer._id })
      .populate({
        path: "riderId",
        select: "name email contactNo avatarUrl",
      })
      .sort({ rideCompleted: 1, createdAt: -1 });

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

export async function markPassengerRideCompleted(req, res, next) {
  try {
    const booking = await RideBooking.findById(req.params.bookingId).populate({
      path: "riderId",
      select: "name email contactNo avatarUrl",
    });

    if (!booking) throw new HttpError(404, "Booking not found");

    const isOwner = String(booking.driverId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Not allowed");

    if (booking.status !== "confirmed") {
      throw new HttpError(400, "Only confirmed bookings can be marked as ride completed");
    }

    if (booking.paymentStatus !== "paid") {
      throw new HttpError(400, "Only paid bookings can be marked as ride completed");
    }

    if (booking.rideCompleted) {
      return res.json({
        ok: true,
        message: "Passenger ride already marked as completed",
        booking,
      });
    }

    booking.rideCompleted = true;
    booking.rideCompletedAt = new Date();
    booking.rideCompletedByDriverId = req.user.sub;
    await booking.save();

    req.io?.to(`rider:${String(booking.riderId?._id || booking.riderId)}`).emit(
      "booking:ride-completed",
      {
        bookingId: String(booking._id),
        offerId: String(booking.offerId),
        rideCompleted: true,
        rideCompletedAt: booking.rideCompletedAt,
      }
    );

    res.json({
      ok: true,
      message: "Passenger ride marked as completed",
      booking,
    });
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

async function loadImageBuffer(src, req) {
  try {
    if (!src || typeof src !== "string") return null;

    if (src.startsWith("data:image/")) {
      const base64 = src.split(",")[1];
      return base64 ? Buffer.from(base64, "base64") : null;
    }

    let finalUrl = src;

    if (src.startsWith("/")) {
      finalUrl = `${req.protocol}://${req.get("host")}${src}`;
    } else if (!src.startsWith("http://") && !src.startsWith("https://")) {
      return null;
    }

    const response = await fetch(finalUrl);
    if (!response.ok) return null;

    const arr = await response.arrayBuffer();
    return Buffer.from(arr);
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

function getLogoSource(req) {
  return (
    process.env.RECEIPT_LOGO_URL ||
    `${req.protocol}://${req.get("host")}/uploads/dropme.jpeg`
  );
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

    // fallback to current driver registration data
    const driverUser = booking?.driverId
      ? await User.findById(booking.driverId)
          .select("avatarUrl driverRegistration")
          .lean()
      : null;

    const regVehicle = driverUser?.driverRegistration?.vehicle || {};

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
      offer?.driverSnapshot?.avatarUrl ||
      offer?.driverSnapshot?.imageUrl ||
      offer?.driverSnapshot?.profileImage ||
      booking?.offerSnapshot?.driverPhotoUrl ||
      booking?.offerSnapshot?.driverAvatarUrl ||
      booking?.offerSnapshot?.driverImageUrl ||
      driverUser?.avatarUrl ||
      booking?.driverPhotoUrl ||
      booking?.driverAvatarUrl ||
      booking?.driverImageUrl ||
      "";

    const vehicleType =
      offer?.vehicleSnapshot?.type ||
      booking?.offerSnapshot?.vehicleType ||
      regVehicle?.type ||
      "—";

    const vehicleNumber =
      offer?.vehicleSnapshot?.number ||
      booking?.offerSnapshot?.vehicleNumber ||
      regVehicle?.number ||
      "—";

    const vehicleColor =
      offer?.vehicleSnapshot?.color ||
      booking?.offerSnapshot?.vehicleColor ||
      regVehicle?.color ||
      "—";

    const vehiclePhotoUrl =
      offer?.vehicleSnapshot?.photoUrl ||
      offer?.vehicleSnapshot?.imageUrl ||
      offer?.vehicleSnapshot?.vehicleImageUrl ||
      booking?.offerSnapshot?.vehiclePhotoUrl ||
      booking?.offerSnapshot?.vehicleImageUrl ||
      regVehicle?.photoUrl ||
      regVehicle?.imageUrl ||
      regVehicle?.vehicleImageUrl ||
      booking?.vehiclePhotoUrl ||
      booking?.vehicleImageUrl ||
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
    const logoUrl = getLogoSource(req);
    const logoBuffer = await loadImageBuffer(logoUrl, req);
    const driverImageBuffer = await loadImageBuffer(driverPhotoUrl, req);
    const vehicleImageBuffer = await loadImageBuffer(vehiclePhotoUrl, req);

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

    if (logoBuffer) {
      doc.image(logoBuffer, x + w / 2 - 34, y + 14, {
        fit: [68, 68],
        align: "center",
        valign: "center",
      });
    } else {
      doc.save();
      doc.circle(x + w / 2, y + 48, 24).fill("#111111");
      doc.restore();

      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16);
      doc.text("D", x + w / 2 - 5, y + 41);
    }

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22);
    doc.text("DropMe Receipt", x + 24, y + 88, {
      width: w - 48,
      align: "center",
    });

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Smart ride booking confirmation", x + 24, y + 114, {
      width: w - 48,
      align: "center",
    });

    doc.save();
    doc.roundedRect(x + w - 145, y + 20, 110, 24, 12).fill("#111111");
    doc.restore();
    doc.fillColor("#ed2b2b").font("Helvetica-Bold").fontSize(10);
    doc.text(String(paymentStatus).toUpperCase(), x + w - 132, y + 28, {
      width: 84,
      align: "center",
    });

    const routeBoxY = y + 164;
    const routeBoxH = 110;
    drawRoundedBox(doc, x + 20, routeBoxY, w - 40, routeBoxH, 18, "#0d0d0d", "#262626");

    doc.fillColor("#6B7280").font("Helvetica").fontSize(10);
    doc.text("TRIP ROUTE", x + 36, routeBoxY + 16);

    const leftRouteX = x + 36;
    const arrowX = x + 240;
    const rightRouteX = x + 286;
    const routeColWidth = 205;

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15);
    doc.text(origin, leftRouteX, routeBoxY + 34, {
      width: routeColWidth,
      height: 62,
      ellipsis: true,
    });

    doc.fillColor("#9CA3AF").font("Helvetica-Bold").fontSize(18);
    doc.text("--->", arrowX, routeBoxY + 34);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15);
    doc.text(destination, rightRouteX, routeBoxY + 34, {
      width: routeColWidth,
      height: 62,
      ellipsis: true,
    });

    const middleBoxY = y + 294;
    const bottomBoxY = y + 498;

    drawRoundedBox(doc, x + 20, middleBoxY, 330, 190, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Booking Summary", x + 36, middleBoxY + 14);

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

    let rowY = middleBoxY + 36;
    for (const [label, value] of rows) {
      doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
      doc.text(label, x + 36, rowY);

      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
      fitText(doc, value, x + 162, rowY, 155);

      rowY += 18;
    }

    drawRoundedBox(doc, x + 366, middleBoxY, 170, 190, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("QR Verify", x + 418, middleBoxY + 14, { width: 70, align: "center" });

    doc.image(qrBuffer, x + 392, middleBoxY + 32, {
      fit: [118, 118],
      align: "center",
      valign: "center",
    });

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(8);
    doc.text("Scan for booking details", x + 390, middleBoxY + 138, {
      width: 122,
      align: "center",
    });

    drawRoundedBox(doc, x + 20, bottomBoxY, 250, 116, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Driver Details", x + 36, bottomBoxY + 12);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Name", x + 36, bottomBoxY + 46);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, driverName, x + 86, bottomBoxY + 46, 90);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Email", x + 36, bottomBoxY + 66);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, driverEmail, x + 86, bottomBoxY + 66, 90);

    if (driverImageBuffer) {
      doc.save();
      doc.roundedRect(x + 176, bottomBoxY + 10, 70, 78, 12).clip();
      doc.image(driverImageBuffer, x + 176, bottomBoxY + 10, {
        fit: [70, 78],
        align: "center",
        valign: "center",
      });
      doc.restore();
      doc.roundedRect(x + 176, bottomBoxY + 10, 70, 78, 12).stroke("#2a2a2a");
    } else {
      doc.save();
      doc.roundedRect(x + 176, bottomBoxY + 10, 70, 78, 12).fill("#121212");
      doc.restore();
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      doc.text("No Image", x + 191, bottomBoxY + 47);
    }

    drawRoundedBox(doc, x + 286, bottomBoxY, 250, 116, 18, "#0d0d0d", "#262626");

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13);
    doc.text("Vehicle Details", x + 302, bottomBoxY + 12);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Type", x + 302, bottomBoxY + 44);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleType, x + 360, bottomBoxY + 44, 88);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Number", x + 302, bottomBoxY + 64);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleNumber, x + 360, bottomBoxY + 64, 88);

    doc.fillColor("#9CA3AF").font("Helvetica").fontSize(10);
    doc.text("Color", x + 302, bottomBoxY + 84);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    fitText(doc, vehicleColor, x + 360, bottomBoxY + 84, 88);

    if (vehicleImageBuffer) {
      doc.save();
      doc.roundedRect(x + 454, bottomBoxY + 8, 66, 82, 12).clip();
      doc.image(vehicleImageBuffer, x + 454, bottomBoxY + 8, {
        fit: [66, 82],
        align: "center",
        valign: "center",
      });
      doc.restore();
      doc.roundedRect(x + 454, bottomBoxY + 8, 66, 82, 12).stroke("#2a2a2a");
    } else {
      doc.save();
      doc.roundedRect(x + 454, bottomBoxY + 8, 66, 82, 12).fill("#121212");
      doc.restore();
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      doc.text("No Image", x + 468, bottomBoxY + 46);
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