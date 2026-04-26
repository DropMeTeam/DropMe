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
import { TrainInventory } from "../modules/train/models/TrainInventory.js";
import { agentDebugLog } from "../utils/agentDebugLog.js";

// for carbon
import { TrainSchedule } from "../modules/train/models/TrainSchedule.js";
import {
  createCarbonImpactForBusBooking,
  createCarbonImpactForTrainBooking,
  syncCarbonImpactForBusBookingId,
} from "../services/carbonImpact.service.js";
// -----carbon

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
  const raw =
    process.env.CLIENT_ORIGIN ||
    process.env.FRONTEND_URL ||
    process.env.VERCEL_CLIENT_ORIGIN ||
    process.env.VITE_CLIENT_URL ||
    "http://localhost:5173";
  let first = raw.split(",")[0].trim();
  if (!first) first = "http://localhost:5173";
  if (first.startsWith("http://") || first.startsWith("https://")) return first;
  if (/^localhost(?::|$)/i.test(first) || /^127\.\d+\.\d+\.\d+/.test(first)) {
    return first.includes("://") ? first : `http://${first}`;
  }
  return `https://${first.replace(/^\/\//, "")}`;
}

function getSafeStripeMessage(err) {
  return err?.message || "Stripe error occurred";
}

function buildDistanceText(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "";
  return `${distanceKm.toFixed(1)} km`;
}

function buildClientReturnUrl(pm, params = {}) {
  const base = getClientBaseUrl().replace(/\/$/, "");
  const parts = [`pm=${encodeURIComponent(pm)}`];

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value) === "") return;
    if (String(value) === "{CHECKOUT_SESSION_ID}") {
      parts.push(`${encodeURIComponent(key)}={CHECKOUT_SESSION_ID}`);
    } else {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      );
    }
  });

  return `${base}/?${parts.join("&")}`;
}

function getModuleFromSession(session) {
  const value = String(session?.metadata?.module || "").toLowerCase();
  if (value === "ride" || value === "train" || value === "bus") return value;
  return "ride";
}


async function finalizeRideBookingFromSession(session) {
  const bookingId = String(
    session?.metadata?.bookingId || session?.client_reference_id || ""
  );

  if (!bookingId) {
    throw new Error("Missing ride bookingId in Stripe session");
  }

  const booking = await RideBooking.findById(bookingId);
  if (!booking) {
    throw new Error("Ride booking not found");
  }

  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) {
    throw new Error("Ride session mismatch");
  }

  if (booking.paymentStatus === "paid" && booking.status === "confirmed") {
    return { booking };
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
    throw new Error("Ride sold out while payment was processing");
  }

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.paidAt = booking.paidAt || new Date();
  booking.stripeSessionId = session.id;
  await booking.save();

  return { booking, offer };
}

function queueTrainTicketEmail(bookingDoc) {
  const booking = bookingDoc?.toObject ? bookingDoc.toObject() : bookingDoc;

  if (!booking?._id) return;
  if (booking.ticketEmailSentAt) return;
  if (!booking.passengerSnapshot?.email) return;

  setImmediate(async () => {
    try {
      const freshBooking = await TrainBooking.findById(booking._id);
      if (!freshBooking) return;
      if (freshBooking.ticketEmailSentAt) return;

      const pdfBuffer = await generateTrainTicketPdfBuffer(
        freshBooking.toObject ? freshBooking.toObject() : freshBooking
      );

      const emailed = await sendTrainTicketEmail({
        to: freshBooking.passengerSnapshot?.email || "",
        name: freshBooking.passengerSnapshot?.name || "",
        booking: freshBooking.toObject ? freshBooking.toObject() : freshBooking,
        pdfBuffer,
      });

      if (emailed) {
        freshBooking.ticketEmailSentAt = new Date();
        await freshBooking.save();
      }
    } catch (err) {
      console.error("Async train ticket email send failed:", err);
    }
  });
}

function queueBusTicketEmail(bookingDoc) {
  const booking = bookingDoc?.toObject ? bookingDoc.toObject() : bookingDoc;

  if (!booking?._id) return;
  if (booking.ticketEmailSentAt) return;
  if (!booking.passengerSnapshot?.email) return;

  setImmediate(async () => {
    try {
      const freshBooking = await BusBooking.findById(booking._id);
      if (!freshBooking) return;
      if (freshBooking.ticketEmailSentAt) return;

      const pdfBuffer = await generateBusTicketPdfBuffer(
        freshBooking.toObject ? freshBooking.toObject() : freshBooking
      );

      const emailed = await sendBusTicketEmail({
        to: freshBooking.passengerSnapshot?.email || "",
        name: freshBooking.passengerSnapshot?.name || "",
        booking: freshBooking.toObject ? freshBooking.toObject() : freshBooking,
        pdfBuffer,
      });

      if (emailed) {
        freshBooking.ticketEmailSentAt = new Date();
        await freshBooking.save();
      }
    } catch (err) {
      console.error("Async bus ticket email send failed:", err);
    }
  });
}

async function finalizeTrainBookingFromSession(session) {
  const bookingId = String(
    session?.metadata?.bookingId || session?.client_reference_id || ""
  );

  if (!bookingId) {
    throw new Error("Missing train bookingId in Stripe session");
  }

  const booking = await TrainBooking.findById(bookingId);
  if (!booking) {
    throw new Error("Train booking not found");
  }

  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) {
    throw new Error("Train session mismatch");
  }

  if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
    if (!booking.ticketEmailSentAt) {
      queueTrainTicketEmail(booking);
    }
    return { booking };
  }

  let inventory = await TrainInventory.findOne({
    scheduleId: booking.scheduleId,
    travelDate: booking.travelDate,
  });

  if (!inventory) {
    const schedule = await TrainSchedule.findById(booking.scheduleId).lean();

    if (!schedule) {
      booking.bookingStatus = "failed";
      booking.paymentStatus = "failed";
      await booking.save();
      throw new Error("Train schedule not found while verifying payment");
    }

    try {
      inventory = await TrainInventory.create({
        scheduleId: booking.scheduleId,
        travelDate: booking.travelDate,
        capacity: Number(schedule.seatCapacity || 0),
        bookedSeats: 0,
      });
    } catch (err) {
      if (err?.code === 11000) {
        inventory = await TrainInventory.findOne({
          scheduleId: booking.scheduleId,
          travelDate: booking.travelDate,
        });
      } else {
        throw err;
      }
    }
  }

  const reservedInventory = await TrainInventory.findOneAndUpdate(
    {
      scheduleId: booking.scheduleId,
      travelDate: booking.travelDate,
      $expr: {
        $gte: [
          { $subtract: ["$capacity", "$bookedSeats"] },
          Number(booking.seats || 0),
        ],
      },
    },
    {
      $inc: { bookedSeats: Number(booking.seats || 0) },
    },
    { new: true }
  );

  if (!reservedInventory) {
    booking.bookingStatus = "failed";
    booking.paymentStatus = "failed";
    await booking.save();
    throw new Error("Train seats sold out while payment was processing");
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

//  try {
//    await createCarbonImpactForTrainBooking(booking);
//  } catch (ecoErr) {
//    console.error("Train carbon impact creation failed:", ecoErr);
//  }

  queueTrainTicketEmail(booking);

  return {
    booking,
    inventory: {
      capacity: reservedInventory.capacity,
      bookedSeats: reservedInventory.bookedSeats,
      remainingSeats:
        Number(reservedInventory.capacity || 0) -
        Number(reservedInventory.bookedSeats || 0),
    },
  };
}

async function finalizeBusBookingFromSession(session) {
  const bookingId = String(
    session?.metadata?.bookingId || session?.client_reference_id || ""
  );

  if (!bookingId) {
    throw new Error("Missing bus bookingId in Stripe session");
  }

  const booking = await BusBooking.findById(bookingId);
  if (!booking) {
    throw new Error("Bus booking not found");
  }

  if (booking.stripeSessionId && booking.stripeSessionId !== session.id) {
    throw new Error("Bus session mismatch");
  }

  if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
    if (!booking.ticketEmailSentAt) {
      queueBusTicketEmail(booking);
    }
    return { booking };
  }

  const otherBookings = await BusBooking.find({
    _id: { $ne: booking._id },
    scheduleId: booking.scheduleId,
    travelDate: booking.travelDate,
  }).lean();

  const hasConflict = otherBookings.some((otherBooking) => {
    if (!isBusBlockingBooking(otherBooking)) return false;
    if (!hasBusSegmentOverlap(otherBooking.segmentKeys, booking.segmentKeys)) {
      return false;
    }

    return otherBooking.seatNumbers.some((seat) =>
      booking.seatNumbers.includes(String(seat).trim().toUpperCase())
    );
  });

  if (hasConflict) {
    booking.bookingStatus = "failed";
    booking.paymentStatus = "failed";
    await booking.save();
    throw new Error(
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
    await syncCarbonImpactForBusBooking(booking);
  } catch (ecoErr) {
    console.error("Bus carbon impact creation failed:", ecoErr);
  }

  queueBusTicketEmail(booking);

  return { booking };
}

async function finalizeCheckoutFromWebhookSession(session) {
  const moduleName = getModuleFromSession(session);
  try {
    if (moduleName === "bus") {
      await finalizeBusBookingFromSession(session);
    } else if (moduleName === "train") {
      await finalizeTrainBookingFromSession(session);
    } else {
      await finalizeRideBookingFromSession(session);
    }
    // #region agent log
    agentDebugLog(
      "payments.controller.js:finalizeCheckoutFromWebhookSession",
      "finalize_ok",
      { module: moduleName, sessionIdTail: String(session?.id || "").slice(-8) },
      "H1"
    );
    // #endregion
  } catch (err) {
    // #region agent log
    agentDebugLog(
      "payments.controller.js:finalizeCheckoutFromWebhookSession",
      "finalize_throw",
      {
        module: moduleName,
        message: String(err?.message || err).slice(0, 200),
      },
      "H1"
    );
    // #endregion
    throw err;
  }
}

export async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // #region agent log
  agentDebugLog(
    "payments.controller.js:stripeWebhook",
    "webhook_hit",
    { hasSignature: Boolean(signature), hasSecret: Boolean(webhookSecret) },
    "H5"
  );
  // #endregion

  if (!webhookSecret) {
    return res.status(500).json({ message: "Stripe webhook not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    // #region agent log
    agentDebugLog(
      "payments.controller.js:stripeWebhook",
      "webhook_signature_ok",
      { eventType: event.type },
      "H5"
    );
    // #endregion
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    // #region agent log
    agentDebugLog(
      "payments.controller.js:stripeWebhook",
      "webhook_signature_fail",
      { message: String(err?.message || err).slice(0, 120) },
      "H5"
    );
    // #endregion
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    // #region agent log
    agentDebugLog(
      "payments.controller.js:stripeWebhook",
      "webhook_checkout_branch",
      {
        paymentStatus: session.payment_status,
        hasMetadataBookingId: Boolean(session?.metadata?.bookingId),
        hasClientRef: Boolean(session?.client_reference_id),
        module: getModuleFromSession(session),
      },
      "H1"
    );
    // #endregion

    if (session.payment_status === "paid") {
      const bookingId =
        session?.metadata?.bookingId || session?.client_reference_id || "";

      if (bookingId) {
        void finalizeCheckoutFromWebhookSession(session).catch((err) => {
          console.error("Stripe webhook async finalize failed:", err?.message || err);
          // #region agent log
          agentDebugLog(
            "payments.controller.js:stripeWebhook",
            "webhook_async_finalize_reject",
            { message: String(err?.message || err).slice(0, 200) },
            "H1"
          );
          // #endregion
        });
      } else {
        console.warn("Stripe webhook ignored: no bookingId in session", {
          eventType: event.type,
          sessionId: session.id,
        });
        // #region agent log
        agentDebugLog(
          "payments.controller.js:stripeWebhook",
          "webhook_no_booking_id",
          { eventType: event.type },
          "H4"
        );
        // #endregion
      }
    }
  }

  return res.json({ received: true });
}

export async function createStripeSession(req, res, next) {
  try {
    const { offerId, seatsBooked, routeDistanceKm } = req.body || {};
    const seats = Number(seatsBooked || 1);
    const userId = getUserId(req);

    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

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
        riderId: userId,
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

    const stripeClient = requireStripeClient();

    const session = await stripeClient.checkout.sessions.create({
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
      success_url: buildClientReturnUrl("ride-success", {
        bookingId: booking._id,
        session_id: "{CHECKOUT_SESSION_ID}",
      }),
      cancel_url: buildClientReturnUrl("ride-cancel", {
        bookingId: booking._id,
      }),
      metadata: {
        bookingId: String(booking._id),
        offerId: String(offer._id),
        seatsBooked: String(seats),
        unitPrice: String(unitPrice),
        totalAmount: String(totalAmount),
        routeDistanceKm: String(normalizedDistanceKm),
        module: "ride",
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
    const userId = getUserId(req);

    // #region agent log
    agentDebugLog(
      "payments.controller.js:verifyStripePayment",
      "verify_start",
      {
        hasBookingId: Boolean(bookingId),
        hasSessionId: Boolean(sessionId),
        userIdPresent: Boolean(userId),
      },
      "H2"
    );
    // #endregion

    if (!bookingId || !sessionId) {
      throw new HttpError(400, "bookingId and session_id are required");
    }

    const booking = await RideBooking.findById(bookingId);

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const isOwner = String(booking.riderId) === userId;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      // #region agent log
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_forbidden",
        { isOwner, role: String(req.user?.role || "") },
        "H2"
      );
      // #endregion
      throw new HttpError(403, "Not allowed");
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const sessionBookingId = String(
      session?.metadata?.bookingId || session?.client_reference_id || ""
    );
    if (!sessionBookingId || sessionBookingId !== String(booking._id)) {
      // #region agent log
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_session_booking_mismatch",
        { sessionBookingIdLen: sessionBookingId.length },
        "H3"
      );
      // #endregion
      throw new HttpError(400, "Session does not match this booking");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      // #region agent log
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_stripe_session_id_mismatch",
        {},
        "H3"
      );
      // #endregion
      throw new HttpError(400, "Session mismatch");
    }

    if (!booking.stripeSessionId) {
      booking.stripeSessionId = sessionId;
      await booking.save();
    }

    if (session.payment_status !== "paid") {
      // #region agent log
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_payment_not_paid",
        { payment_status: session.payment_status },
        "H3"
      );
      // #endregion
      throw new HttpError(402, "Payment not completed");
    }

    const result = await finalizeRideBookingFromSession(session);
    // #region agent log
    agentDebugLog(
      "payments.controller.js:verifyStripePayment",
      "verify_success",
      {
        bookingStatus: result?.booking?.status,
        paymentStatus: result?.booking?.paymentStatus,
      },
      "H2"
    );
    // #endregion
    return res.json({ ok: true, ...result });
  } catch (err) {
    // #region agent log
    if (err instanceof HttpError) {
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_http_error",
        { status: err.status, message: String(err.message || "").slice(0, 120) },
        "H2"
      );
    } else {
      agentDebugLog(
        "payments.controller.js:verifyStripePayment",
        "verify_unexpected_error",
        { message: String(err?.message || err).slice(0, 120) },
        "H3"
      );
    }
    // #endregion
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
        `Minimum train payment is LKR ${MIN_TRAIN_PAYMENT_LKR}. Current total is LKR ${amount.toFixed(
          2
        )}. Increase seats or fare before checkout.`
      );
    }

    const unitAmount = Math.round(amount * 100);
    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      throw new HttpError(400, "Train booking amount is invalid for Stripe");
    }

    const stripeClient = requireStripeClient();

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
        success_url: buildClientReturnUrl("train-success", {
          bookingId: booking._id,
          session_id: "{CHECKOUT_SESSION_ID}",
        }),
        cancel_url: buildClientReturnUrl("train-cancel", {
          bookingId: booking._id,
        }),
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

    if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
      if (!booking.ticketEmailSentAt) {
        queueTrainTicketEmail(booking);
      }
      return res.json({ ok: true, booking });
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const sessionBookingId = String(
      session?.metadata?.bookingId || session?.client_reference_id || ""
    );
    if (!sessionBookingId || sessionBookingId !== String(booking._id)) {
      throw new HttpError(400, "Session does not match this booking");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    if (!booking.stripeSessionId) {
      booking.stripeSessionId = sessionId;
      await booking.save();
    }

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    const result = await finalizeTrainBookingFromSession(session);
    return res.json({ ok: true, ...result });
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
        success_url: buildClientReturnUrl("bus-success", {
          bookingId: booking._id,
          session_id: "{CHECKOUT_SESSION_ID}",
        }),
        cancel_url: buildClientReturnUrl("bus-cancel", {
          bookingId: booking._id,
        }),
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

    if (booking.paymentStatus === "paid" && booking.bookingStatus === "booked") {
      if (!booking.ticketEmailSentAt) {
        queueBusTicketEmail(booking);
      }
      return res.json({ ok: true, booking });
    }

    const stripeClient = requireStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const sessionBookingId = String(
      session?.metadata?.bookingId || session?.client_reference_id || ""
    );
    if (!sessionBookingId || sessionBookingId !== String(booking._id)) {
      throw new HttpError(400, "Session does not match this booking");
    }

    if (booking.stripeSessionId && booking.stripeSessionId !== sessionId) {
      throw new HttpError(400, "Session mismatch");
    }

    if (!booking.stripeSessionId) {
      booking.stripeSessionId = sessionId;
      await booking.save();
    }

    if (session.payment_status !== "paid") {
      throw new HttpError(402, "Payment not completed");
    }

    const result = await finalizeBusBookingFromSession(session);
    return res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}