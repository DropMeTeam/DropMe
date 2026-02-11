import { RideOffer } from "../models/RideOffer.js";
import { RideRequest } from "../models/RideRequest.js";
import { Match } from "../models/Match.js";

/**
 * MVP matching heuristic:
 * - Origin near + destination near
 * - Time window compatibility
 * - Seats available
 * - Score = time difference minutes (lower is better)
 */
export async function findAndStoreMatches({ requestId, originMaxM = 3000, destMaxM = 3500, limit = 10 }) {
  const request = await RideRequest.findById(requestId);
  if (!request) return [];

  const pickup = request.pickupTime;
  const reqWindow = request.timeWindowMins ?? 15;

  const candidates = await RideOffer.find({
    status: "open",
    seatsAvailable: { $gte: request.seatsNeeded },
    "origin.point": {
      $near: { $geometry: request.origin.point, $maxDistance: originMaxM }
    },
    "destination.point": {
      $near: { $geometry: request.destination.point, $maxDistance: destMaxM }
    }
  }).limit(50);

  const scored = candidates
    .map((offer) => {
      const offerWindow = offer.timeWindowMins ?? 15;
      const maxWindow = Math.max(reqWindow, offerWindow);

      const diffMins = Math.abs(pickup.getTime() - offer.pickupTime.getTime()) / (60 * 1000);
      if (diffMins > maxWindow) return null;

      return { offer, score: diffMins };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);

  const matches = [];
  for (const { offer, score } of scored) {
    const m = await Match.findOneAndUpdate(
      { offerId: offer._id, requestId: request._id },
      { $setOnInsert: { score, status: "proposed" } },
      { upsert: true, new: true }
    );
    matches.push(m);
  }

  return matches;
}

export async function acceptMatch({ matchId, userId }) {
  const match = await Match.findById(matchId).populate("offerId").populate("requestId");
  if (!match) return null;
  if (match.requestId.riderId.toString() !== userId) return null;

  if (match.status !== "proposed") return match;

  match.status = "accepted";
  await match.save();

  const offer = match.offerId;
  offer.seatsAvailable = Math.max(0, offer.seatsAvailable - match.requestId.seatsNeeded);
  if (offer.seatsAvailable === 0) offer.status = "closed";
  await offer.save();

  match.requestId.status = "matched";
  await match.requestId.save();

  return match;
}
