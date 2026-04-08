import api from "./api";

// =========================
// Public train endpoints
// =========================

export async function getTrainStations() {
  const res = await api.get("/api/train/stations");
  return res.data;
}

export async function searchNearbyTrains(params) {
  const res = await api.get("/api/train/search-nearby", { params });
  return res.data;
}

export async function getTrainScheduleDetails(id, params = {}) {
  const res = await api.get(`/api/train/schedules/${id}`, { params });
  return res.data;
}

export async function getNearestStations(params) {
  const res = await api.get("/api/train/nearest-stations", { params });
  return res.data;
}

// =========================
// Protected booking endpoints
// =========================

export async function createTrainBooking(payload) {
  const res = await api.post("/api/train/bookings/checkout", payload);
  return res.data;
}

export async function getMyTrainBookings() {
  const res = await api.get("/api/train/bookings/mine");
  return res.data;
}

export async function getMyTrainBookingById(id) {
  const res = await api.get(`/api/train/bookings/${id}`);
  return res.data;
}

export async function cancelMyTrainBooking(id) {
  const res = await api.patch(`/api/train/bookings/${id}/cancel`);
  return res.data;
}

// =========================
// Stripe payment endpoints
// =========================

export async function createTrainStripeSession(bookingId) {
  const res = await api.post("/api/payments/stripe/train/session", {
    bookingId,
  });
  return res.data;
}

export async function verifyTrainStripePayment({ bookingId, sessionId }) {
  const res = await api.get("/api/payments/stripe/train/verify", {
    params: {
      bookingId,
      session_id: sessionId,
    },
  });
  return res.data;
}