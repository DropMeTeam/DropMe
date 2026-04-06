import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { HttpError } from "../utils/httpError.js";
import PDFDocument from "pdfkit";

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

export async function downloadReceipt(req, res, next) {
  try {
    const bookingId = req.params.bookingId;

    const booking = await RideBooking.findById(bookingId)
      .populate({
        path: "offerId",
        select: "origin destination pickupTime priceLkr driverSnapshot vehicleSnapshot seatsTotal seatsAvailable",
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

    const vehicleType = offer?.vehicleSnapshot?.type || booking?.offerSnapshot?.vehicleType || "—";
    const vehicleNumber = offer?.vehicleSnapshot?.number || booking?.offerSnapshot?.vehicleNumber || "—";
    const vehicleColor = offer?.vehicleSnapshot?.color || booking?.offerSnapshot?.vehicleColor || "—";

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
        : "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="DropMe-Receipt-${bookingId}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text("DropMe - Booking Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(11).fillColor("#444");
    doc.text(`Receipt ID: ${bookingId}`);
    doc.text(`Issued: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fillColor("#000").fontSize(13).text("Booking Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Route: ${origin}  →  ${destination}`);
    doc.text(`Pickup: ${pickupTime}`);
    if (routeDistanceText) {
      doc.text(`Distance: ${routeDistanceText}`);
    }
    doc.text(`Seats Booked: ${seatsBooked}`);
    doc.text(`Price Per Ticket: ${currency} ${unitPrice.toLocaleString()}`);
    doc.text(`Total Amount: ${currency} ${amount.toLocaleString()}`);
    doc.text(`Booking Status: ${booking.status || "—"}`);
    doc.text(`Payment Status: ${paymentStatus}`);
    doc.text(`Paid At: ${paidAt}`);
    doc.moveDown();

    doc.fontSize(13).text("Driver Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Name: ${driverName}`);
    doc.text(`Email: ${driverEmail}`);
    doc.moveDown();

    doc.fontSize(13).text("Vehicle Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Type: ${vehicleType}`);
    doc.text(`Number: ${vehicleNumber}`);
    doc.text(`Color: ${vehicleColor}`);
    doc.moveDown();

    doc.fillColor("#666").fontSize(10).text(
      "Thank you for using DropMe. Keep this receipt for your records.",
      { align: "center" }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
}