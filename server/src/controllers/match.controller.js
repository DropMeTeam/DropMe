import { z } from "zod";
import { findAndStoreMatches, acceptMatch } from "../services/matching.service.js";
import { Match } from "../models/Match.js";

const FindSchema = z.object({
  requestId: z.string(),
  originMaxM: z.number().int().min(500).max(15000).optional(),
  destMaxM: z.number().int().min(500).max(15000).optional()
});

export async function findMatches(req, res, next) {
  try {
    const body = FindSchema.parse(req.body);

    const matches = await findAndStoreMatches({
      requestId: body.requestId,
      originMaxM: body.originMaxM ?? 3000,
      destMaxM: body.destMaxM ?? 3500
    });

    const populated = await Match.find({ _id: { $in: matches.map((m) => m._id) } })
      .populate("offerId")
      .populate("requestId")
      .sort({ score: 1 });

    if (req.io) req.io.to(`rider:${req.user.sub}`).emit("matches:updated", { requestId: body.requestId });

    res.json({ matches: populated });
  } catch (err) {
    next(err);
  }
}

export async function accept(req, res, next) {
  try {
    const matchId = req.params.matchId;
    const match = await acceptMatch({ matchId, userId: req.user.sub });
    if (!match) return res.status(404).json({ error: "Match not found or not allowed" });

    if (req.io) {
      req.io.to(`driver:${match.offerId.driverId.toString()}`).emit("match:accepted", { matchId });
      req.io.to(`rider:${req.user.sub}`).emit("match:accepted", { matchId });
    }

    res.json({ match });
  } catch (err) {
    next(err);
  }
}
