import { api } from "../lib/api";

export async function createRideReview(payload) {
  const { data } = await api.post("/api/reviews", payload);
  return data;
}

export async function getBookingReview(bookingId) {
  const { data } = await api.get(`/api/reviews/booking/${bookingId}`);
  return data;
}

export async function getMyPendingRideReviews() {
  const { data } = await api.get("/api/reviews/mine/pending");
  return data;
}

export async function getDriverReviews(driverId) {
  const { data } = await api.get(`/api/reviews/driver/${driverId}`);
  return data;
}