import Stripe from "stripe";
import { RideOffer } from "../models/RideOffer.js";
import { RideBooking } from "../models/RideBooking.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { TrainBooking } from "../modules/train/models/TrainBooking.js";
import {
  generateTrainTicketPdfBuffer,
  getTrainTicketNumber,
} from "../modules/train/utils/trainTicket.js";

import { generateBusTicketPdfBuffer } from "../modules/bus/utils/busTicketPdf.js";
import {
  sendTrainTicketEmail,
  sendBusTicketEmail,
} from "../utils/mailer.js";
import { BusBooking } from "../modules/bus/models/BusBooking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const MIN_TRAIN_PAYMENT_LKR = Number(process.env.MIN_TRAIN_PAYMENT_LKR || 200);


const BUS_PAYMENT_HOLD_MINUTES = 10;

function isBusPendingHoldActive(booking) {
  if (
    booking?.bookingStatus !== "pending_payment" ||
    booking?.paymentStatus !== "pending"
  ) {
    return false;
  }

  const createdAtMs = new Date(booking.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return false;

  return Date.now() - createdAtMs <= BUS_PAYMENT_HOLD_MINUTES * 60 * 1000;
}

function isBusBlockingBooking(booking) {
  if (booking?.bookingStatus === "booked" && booking?.paymentStatus === "paid") {
    return true;
  }

  return isBusPendingHoldActive(booking);
}

function hasBusSegmentOverlap(a = [], b = []) {
  const set = new Set(a);
  return b.some((key) => set.has(key));
}

function normalizeDistanceKm(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Number(num.toFixed(1));
}

function getUserId(req) {
  return String(req.user?.sub || req.user?._id || req.user?.id || "");
}

function requireRider(req) {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
}

function requireStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(500, "Stripe not configured");
  }
  return stripe;
}

function getClientBaseUrl() {
  return process.env.CLIENT_ORIGIN || "http://localhost:5173";
}

function getSafeStripeMessage(err) {
  return err?.message || "Stripe error occurred";
}

function buildDistanceText(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "";
  return `${distanceKm.toFixed(1)} km`;
}

export async function createStripeSession(req, res, next) {
  try {
    const { offerId, seatsBooked, routeDistanceKm } = req.body || {};
    const seats = Number(seatsBooked || 1);

    if (!offerId) {
      throw new HttpError(400, "offerId is required");
    }

    if (!Number.isFinite(seats) || seats < 1 || seats > 6) {
      throw new HttpError(400, "Invalid seatsBooked");
    }

    const offer = await RideOffer.findById(offerId).lean();

    if (!offer) {
      throw new HttpError(404, "Offer not found");
    }

    if (offer.status !== "open") {
      throw new HttpError(409, "Offer not open");
    }

    if ((offer.seatsAvailable ?? 0) < seats) {
      throw new HttpError(409, "Not enough seats");
    }

    const unitPrice = Number(offer.priceLkr || 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new HttpError(400, "Offer price not set");
    }

    const totalAmount = unitPrice * seats;

    const normalizedDistanceKm = normalizeDistanceKm(routeDistanceKm);
    const routeDistanceText = buildDistanceText(normalizedDistanceKm);

    let fallbackVehiclePhotoUrl = "";
    if (
      !offer?.vehicleSnapshot?.photoUrl &&
      !offer?.vehicleSnapshot?.imageUrl &&
      !offer?.vehicleSnapshot?.vehicleImageUrl
    ) {
      const driver = await User.findById(offer.driverId).lean();
      fallbackVehiclePhotoUrl =
        driver?.driverRegistration?.vehicle?.photoUrl ||
        driver?.driverRegistration?.vehicle?.imageUrl ||
        driver?.driverRegistration?.vehicle?.vehicleImageUrl ||
        "";
    }

    const finalVehiclePhotoUrl =
      offer?.vehicleSnapshot?.photoUrl ||
      offer?.vehicleSnapshot?.imageUrl ||
      offer?.vehicleSnapshot?.vehicleImageUrl ||
      fallbackVehiclePhotoUrl ||
      "";

    let booking;

    try {
      booking = await RideBooking.create({
        offerId: offer._id,
        riderId: req.user.sub,
        driverId: offer.driverId,
        seatsBooked: seats,
        status: "pending",
        paymentStatus: "unpaid",
        amount: totalAmount,
        currency: "lkr",
        stripeSessionId: "",
        routeDistanceKm: normalizedDistanceKm,
        routeDistanceText,
        offerSnapshot: {
          originAddress: offer.origin?.address || "",
          destinationAddress: offer.destination?.address || "",
          pickupTime: offer.pickupTime || null,
          priceLkr: unitPrice,
          driverName: offer.driverSnapshot?.name || "",
          driverEmail: offer.driverSnapshot?.email || "",
          driverAvatarUrl:
            offer.driverSnapshot?.avatarUrl ||
            offer.driverSnapshot?.photoUrl ||
            offer.driverSnapshot?.imageUrl ||
            "",
          vehicleType: offer.vehicleSnapshot?.type || "",
          vehicleNumber: offer.vehicleSnapshot?.number || "",
          vehicleColor: offer.vehicleSnapshot?.color || "",
          vehiclePhotoUrl: finalVehiclePhotoUrl,
          routeDistanceKm: normalizedDistanceKm,
          routeDistanceText,
        },
      });
    } catch (e) {
      if (e?.code === 11000) {
        throw new HttpError(409, "You already booked this ride.");
      }
      throw e;
    }

    const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: "DropMe Ride Booking",
              description: `${offer.origin?.address || ""} → ${offer.destination?.address || ""}`,
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: seats,
        },
      ],
      success_url: `${base}/checkout/success?bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel?bookingId=${booking._id}`,
      metadata: {
        bookingId: String(booking._id),
        offerId: String(offer._id),
        seatsBooked: String(seats),
        unitPrice: String(unitPrice),
        totalAmount: String(totalAmount),
        routeDistanceKm: String(normalizedDistanceKm),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
      seatsBooked: seats,
      unitPrice,
      totalAmount,
      routeDistanceKm: normalizedDistanceKm,
      routeDistanceText,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyStripePayment(req, res, next) {
  try {
    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await RideBooking.findById(bookingId);

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const isOwner = String(booking.riderId) === String(req.user.sub);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Not allowed");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    if (booking.paymentStatus === "paid" && booking.status === "confirmed") {
      return res.json({ ok: true, booking });
    }

    const offer = await RideOffer.findOneAndUpdate(
      {
        _id: booking.offerId,
        status: "open",
        seatsAvailable: { $gte: booking.seatsBooked },
      },
      {
        $inc: { seatsAvailable: -booking.seatsBooked },
      },
      { new: true }
    );

    if (!offer) {
      booking.status = "rejected";
      booking.paymentStatus = "failed";
      await booking.save();
      throw new HttpError(409, "Ride sold out while paying. Booking rejected.");
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidAt = new Date();
    await booking.save();

    return res.json({ ok: true, booking, offer });
  } catch (err) {
    next(err);
  }
}

export async function createTrainStripeSession(req, res, next) {
  try {
    requireRider(req);

    const { bookingId } = req.body || {};
    if (!bookingId) {
      throw new HttpError(400, "bookingId is required");
    }

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can pay for this train booking");
    }

    if (booking.bookingStatus === "cancelled") {
      throw new HttpError(409, "Booking is cancelled");
    }

    if (booking.bookingStatus === "failed") {
      throw new HttpError(409, "Booking is marked as failed");
    }

    if (booking.paymentStatus === "paid") {
      throw new HttpError(409, "Booking is already paid");
    }

    const amount = Number(booking.totalFareLkr || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(400, "Train booking amount is invalid");
    }

    if (amount < MIN_TRAIN_PAYMENT_LKR) {
      throw new HttpError(
        400,
        `Minimum train payment is LKR ${MIN_TRAIN_PAYMENT_LKR}. Current total is LKR ${amount.toFixed(2)}. Increase seats or fare before checkout.`
      );
    }

    const unitAmount = Math.round(amount * 100);
    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      throw new HttpError(400, "Train booking amount is invalid for Stripe");
    }

    const stripeClient = requireStripeClient();
    const base = getClientBaseUrl();

    const trainNo = booking.journeySnapshot?.trainNo || "";
    const trainName = booking.journeySnapshot?.trainName || "";
    const dep = booking.journeySnapshot?.departureTime || "";
    const arr = booking.journeySnapshot?.arrivalTime || "";

    let session;
    try {
      session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        client_reference_id: String(booking._id),
        customer_email: booking.passengerSnapshot?.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "lkr",
              product_data: {
                name: "DropMe Train Booking",
                description:
                  `${booking.boardingStationName} → ${booking.destinationStationName}` +
                  `${trainNo ? ` | ${trainNo}` : ""}` +
                  `${trainName ? ` | ${trainName}` : ""}` +
                  `${dep || arr ? ` | ${dep} - ${arr}` : ""}` +
                  `${booking.travelDate ? ` | ${booking.travelDate}` : ""}`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        success_url:
          `${base}/train-service/bookings?payment=success` +
          `&bookingId=${booking._id}` +
          `&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${base}/train-service/bookings?payment=cancelled` +
          `&bookingId=${booking._id}`,
        metadata: {
          bookingId: String(booking._id),
          module: "train",
          passengerId: String(booking.passengerId),
          riderRole: String(req.user.role || ""),
          scheduleId: String(booking.scheduleId || ""),
        },
      });
    } catch (err) {
      booking.bookingStatus = "failed";
      booking.paymentStatus = "failed";
      await booking.save();
      throw new HttpError(err?.statusCode || 500, getSafeStripeMessage(err));
    }

    booking.stripeSessionId = session.id;
    booking.bookingStatus = "pending_payment";
    booking.paymentStatus = "pending";
    await booking.save();

    return res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyTrainStripePayment(req, res, next) {
  try {
    requireRider(req);

    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await TrainBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Train booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can verify this payment");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
      return res.json({ ok: true, booking });
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    booking.bookingStatus = "booked";
    booking.paymentStatus = "paid";
    booking.paymentReference = String(
      session.payment_intent || booking.paymentReference || ""
    );
    booking.stripeSessionId = session.id;
    booking.paidAt = booking.paidAt || new Date();
    booking.ticketNumber = booking.ticketNumber || getTrainTicketNumber(booking);

    await booking.save();

    try {
      const pdfBuffer = await generateTrainTicketPdfBuffer(
        booking.toObject ? booking.toObject() : booking
      );

      const emailed = await sendTrainTicketEmail({
        to: booking.passengerSnapshot?.email || "",
        name: booking.passengerSnapshot?.name || "",
        booking: booking.toObject ? booking.toObject() : booking,
        pdfBuffer,
      });

      if (emailed) {
        booking.ticketEmailSentAt = new Date();
        await booking.save();
      }
    } catch (mailErr) {
      console.error("Train ticket email send failed:", mailErr);
    }

    return res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}


export async function createBusStripeSession(req, res, next) {
  try {
    requireRider(req);

    const { bookingId } = req.body || {};
    if (!bookingId) {
      throw new HttpError(400, "bookingId is required");
    }

    const booking = await BusBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Bus booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can pay for this bus booking");
    }

    if (booking.bookingStatus === "cancelled") {
      throw new HttpError(409, "Booking is cancelled");
    }

    if (booking.bookingStatus === "failed") {
      throw new HttpError(409, "Booking is marked as failed");
    }

    if (booking.paymentStatus === "paid") {
      throw new HttpError(409, "Booking is already paid");
    }

    const amount = Number(booking.totalAmountLkr || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(400, "Bus booking amount is invalid");
    }

    const unitAmount = Math.round(amount * 100);
    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      throw new HttpError(400, "Bus booking amount is invalid for Stripe");
    }

    const stripeClient = requireStripeClient();
    const base = getClientBaseUrl();

    let session;
    try {
      session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        client_reference_id: String(booking._id),
        customer_email: booking.passengerSnapshot?.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "lkr",
              product_data: {
                name: "DropMe Bus Ticket",
                description:
                  `${booking.pickupStop?.label || ""} → ${booking.dropoffStop?.label || ""}` +
                  `${booking.journeySnapshot?.busNumber ? ` | Bus ${booking.journeySnapshot.busNumber}` : ""}` +
                  `${booking.travelDate ? ` | ${booking.travelDate}` : ""}`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        success_url:
          `${base}/bus-booking/checkout/success` +
          `?bookingId=${booking._id}` +
          `&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${base}/bus-booking/checkout/cancel` +
          `?bookingId=${booking._id}`,
        metadata: {
          bookingId: String(booking._id),
          module: "bus",
          passengerId: String(booking.passengerId),
          scheduleId: String(booking.scheduleId || ""),
          travelDate: String(booking.travelDate || ""),
        },
      });
    } catch (err) {
      booking.bookingStatus = "failed";
      booking.paymentStatus = "failed";
      await booking.save();
      throw new HttpError(err?.statusCode || 500, getSafeStripeMessage(err));
    }

    booking.stripeSessionId = session.id;
    booking.bookingStatus = "pending_payment";
    booking.paymentStatus = "pending";
    await booking.save();

    return res.json({
      ok: true,
      url: session.url,
      bookingId: booking._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyBusStripePayment(req, res, next) {
  try {
    requireRider(req);

    const bookingId = String(req.query.bookingId || "");
    const sessionId = String(req.query.session_id || "");

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await BusBooking.findById(bookingId);
    if (!booking) {
      throw new HttpError(404, "Bus booking not found");
    }

    const userId = getUserId(req);
    const isOwner = String(booking.passengerId) === userId;

    if (!isOwner) {
      throw new HttpError(403, "Only the booking rider can verify this payment");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
      return res.json({ ok: true, booking });
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    const otherBookings = await BusBooking.find({
      _id: { $ne: booking._id },
      scheduleId: booking.scheduleId,
      travelDate: booking.travelDate,
    }).lean();

    const hasConflict = otherBookings.some((otherBooking) => {
      if (!isBusBlockingBooking(otherBooking)) return false;
      if (!hasBusSegmentOverlap(otherBooking.segmentKeys, booking.segmentKeys)) return false;

      return otherBooking.seatNumbers.some((seat) =>
        booking.seatNumbers.includes(String(seat).trim().toUpperCase())
      );
    });

    if (hasConflict) {
      booking.bookingStatus = "failed";
      booking.paymentStatus = "failed";
      await booking.save();

      throw new HttpError(
        409,
        "Selected seat was already sold for this journey segment while payment was processing"
      );
    }

    booking.bookingStatus = "booked";
    booking.paymentStatus = "paid";
    booking.paymentReference = String(
      session.payment_intent || booking.paymentReference || ""
    );
    booking.stripeSessionId = session.id;
    booking.paidAt = booking.paidAt || new Date();

    await booking.save();

    try {
      const pdfBuffer = await generateBusTicketPdfBuffer(
        booking.toObject ? booking.toObject() : booking
      );

      const emailed = await sendBusTicketEmail({
        to: booking.passengerSnapshot?.email || "",
        name: booking.passengerSnapshot?.name || "",
        booking: booking.toObject ? booking.toObject() : booking,
        pdfBuffer,
      });

      if (emailed) {
        booking.ticketEmailSentAt = new Date();
        await booking.save();
      }
    } catch (mailErr) {
      console.error("Bus ticket email send failed:", mailErr);
    }

    return res.json({ ok: true, booking });
  } catch (err) {
    next(err);
  }
}