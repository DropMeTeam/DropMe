import { TrainBooking } from "../modules/train/models/TrainBooking.js";
import { BusBooking } from "../modules/bus/models/BusBooking.js";
import { RideBooking } from "../models/RideBooking.js";
import CarbonImpact from "../models/CarbonImpact.js";
import {
  syncCarbonImpactForTrainBookingId,
  syncCarbonImpactForBusBookingId,
  syncCarbonImpactForRideBookingId,
} from "./carbonImpact.service.js";

export async function autoBackfillTrainCarbonImpacts() {
  const bookings = await TrainBooking.find({
    bookingStatus: "booked",
    paymentStatus: "paid",
    ticketUsageStatus: "used",
  }).lean();

  for (const booking of bookings) {
    try {
      const exists = await CarbonImpact.exists({
        sourceType: "train_booking",
        sourceId: booking._id,
      });

      if (!exists) {
        await syncCarbonImpactForTrainBookingId(booking._id);
      }
    } catch (err) {
      console.error(
        "Auto backfill failed for train booking",
        String(booking._id),
        err?.message || err
      );
    }
  }
}

export async function autoBackfillBusCarbonImpacts() {
  const bookings = await BusBooking.find({
    bookingStatus: "booked",
    paymentStatus: "paid",
  }).lean();

  for (const booking of bookings) {
    try {
      const exists = await CarbonImpact.exists({
        sourceType: "bus_booking",
        sourceId: booking._id,
      });

      if (!exists) {
        await syncCarbonImpactForBusBookingId(booking._id);
      }
    } catch (err) {
      console.error(
        "Auto backfill failed for bus booking",
        String(booking._id),
        err?.message || err
      );
    }
  }
}

export async function autoBackfillRideCarbonImpacts() {
  const bookings = await RideBooking.find({
    status: "confirmed",
    paymentStatus: "paid",
    rideCompleted: true,
  }).lean();

  for (const booking of bookings) {
    try {
      const exists = await CarbonImpact.exists({
        sourceType: "ride_booking",
        sourceId: booking._id,
      });

      if (!exists) {
        await syncCarbonImpactForRideBookingId(booking._id);
      }
    } catch (err) {
      console.error(
        "Auto backfill failed for ride booking",
        String(booking._id),
        err?.message || err
      );
    }
  }
}

export async function autoBackfillAllCarbonImpacts() {
  await autoBackfillTrainCarbonImpacts();
  await autoBackfillBusCarbonImpacts();
  await autoBackfillRideCarbonImpacts();
}