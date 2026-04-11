import api from "./api";

/**
 * Manual ticket verification for train admin / conductor.
 * POST /api/admin/train/tickets/verify — requires ADMIN_TRAIN + auth.
 */
export async function verifyTrainTicketCode(code) {
  const res = await api.post("/api/admin/train/tickets/verify", { code });
  return res.data;
}

/**
 * Mark a valid ticket as used.
 * PATCH /api/admin/train/tickets/:id/mark-used — requires ADMIN_TRAIN + auth.
 */
export async function markTrainTicketAsUsed(bookingId) {
  const res = await api.patch(`/api/admin/train/tickets/${bookingId}/mark-used`);
  return res.data;
}
