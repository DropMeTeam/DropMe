// server/src/controllers/eco.controller.js
import mongoose from "mongoose";
import CarbonImpact from "../models/CarbonImpact.js";
import { syncCarbonImpactsForUser,
         syncCarbonImpactForBusBookingId,
           syncCarbonImpactForTrainBookingId,
           syncCarbonImpactForRideBookingId,
 } from "../services/carbonImpact.service.js";

function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { start, end };
}

function getUserIdFromReq(req) {
  return req?.user?.sub || req?.user?._id || req?.user?.id || null;
}

function toObjectId(value) {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

export async function getMyEcoStats(req, res, next) {
  try {
    const rawUserId = getUserIdFromReq(req);
    const userId = toObjectId(rawUserId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await syncCarbonImpactsForUser(userId);
    } catch (syncErr) {
      console.error("Eco sync failed:", syncErr);
    }

    const { start, end } = getCurrentMonthRange();

    const [lifetimeAgg] = await CarbonImpact.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalSavedKg: { $sum: "$savedKg" },
          totalPoints: { $sum: "$points" },
          totalFuelLiters: { $sum: "$avoidedFuelLiters" },
        },
      },
    ]);

    const [monthAgg] = await CarbonImpact.aggregate([
      {
        $match: {
          userId,
          occurredAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          monthTrips: { $sum: 1 },
          monthSavedKg: { $sum: "$savedKg" },
          monthPoints: { $sum: "$points" },
        },
      },
    ]);

    const monthLeaderboard = await CarbonImpact.aggregate([
      {
        $match: {
          occurredAt: { $gte: start, $lt: end },
        },
      },
      { $sort: { occurredAt: -1 } },
      {
        $group: {
          _id: "$userId",
          points: { $sum: "$points" },
          savedKg: { $sum: "$savedKg" },
          trips: { $sum: 1 },
          userSnapshot: { $first: "$userSnapshot" },
        },
      },
      { $sort: { points: -1, savedKg: -1, trips: -1, _id: 1 } },
    ]);

    let rank = null;

    for (let i = 0; i < monthLeaderboard.length; i += 1) {
      if (String(monthLeaderboard[i]._id) === String(userId)) {
        rank = i + 1;
        break;
      }
    }

    const recentImpacts = await CarbonImpact.find({ userId })
      .sort({ occurredAt: -1 })
      .limit(5)
      .lean();

    res.json({
      lifetime: {
        totalTrips: lifetimeAgg?.totalTrips || 0,
        totalSavedKg: Number((lifetimeAgg?.totalSavedKg || 0).toFixed(3)),
        totalPoints: lifetimeAgg?.totalPoints || 0,
        totalFuelLiters: Number((lifetimeAgg?.totalFuelLiters || 0).toFixed(3)),
      },
      month: {
        monthTrips: monthAgg?.monthTrips || 0,
        monthSavedKg: Number((monthAgg?.monthSavedKg || 0).toFixed(3)),
        monthPoints: monthAgg?.monthPoints || 0,
        rank,
      },
      recentImpacts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEcoLeaderboard(req, res, next) {
  try {
    const period = String(req.query.period || "month").toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    const { start, end } = getCurrentMonthRange();

    const match =
      period === "lifetime"
        ? {}
        : { occurredAt: { $gte: start, $lt: end } };

    const items = await CarbonImpact.aggregate([
      { $match: match },
      { $sort: { occurredAt: -1 } },
      {
        $group: {
          _id: "$userId",
          points: { $sum: "$points" },
          savedKg: { $sum: "$savedKg" },
          trips: { $sum: 1 },
          fuelLiters: { $sum: "$avoidedFuelLiters" },
          userSnapshot: { $first: "$userSnapshot" },
        },
      },
      { $sort: { points: -1, savedKg: -1, trips: -1, _id: 1 } },
      { $limit: limit },
    ]);

    res.json({
      period,
      items: items.map((item, index) => ({
        rank: index + 1,
        userId: item._id,
        name: item?.userSnapshot?.name || "Anonymous rider",
        email: item?.userSnapshot?.email || "",
        points: item.points || 0,
        savedKg: Number((item.savedKg || 0).toFixed(3)),
        trips: item.trips || 0,
        fuelLiters: Number((item.fuelLiters || 0).toFixed(3)),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function syncMyEcoStats(req, res, next) {
  try {
    const rawUserId = getUserIdFromReq(req);
    const userId = toObjectId(rawUserId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await syncCarbonImpactsForUser(userId);

    return res.json({
      ok: true,
      message: "Eco sync completed",
      result,
    });
  } catch (error) {
    next(error);
  }
}

export async function syncTrainCarbonByBookingId(req, res, next) {
  try {
    const impact = await syncCarbonImpactForTrainBookingId(req.params.bookingId);

    return res.json({
      ok: true,
      created: Boolean(impact),
      impact,
    });
  } catch (error) {
    next(error);
  }
}

export async function syncBusCarbonByBookingId(req, res, next) {
  try {
    const impact = await syncCarbonImpactForBusBookingId(req.params.bookingId);

    return res.json({
      ok: true,
      created: Boolean(impact),
      impact,
    });
  } catch (error) {
    next(error);
  }
}

export async function syncRideCarbonByBookingId(req, res, next) {
  try {
    const impact = await syncCarbonImpactForRideBookingId(req.params.bookingId);

    return res.json({
      ok: true,
      created: Boolean(impact),
      impact,
    });
  } catch (error) {
    next(error);
  }
}