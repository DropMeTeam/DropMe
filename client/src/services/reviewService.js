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

export async function getMyGivenReviews() {
  const { data } = await api.get("/api/reviews/mine/given");
  return data;
}

export async function updateRideReview(reviewId, payload) {
  const { data } = await api.patch(`/api/reviews/${reviewId}`, payload);
  return data;
}

export async function getReviewById(reviewId) {
  const { data } = await api.get(`/api/reviews/${reviewId}`);
  return data;
}

export async function getDriverPublicProfile(driverId) {
  const { data } = await api.get(`/api/reviews/drivers/${driverId}/public-profile`);
  return data;
}

export async function getDriverPublicReviews(driverId, params = {}) {
  const { data } = await api.get(`/api/reviews/drivers/${driverId}/public-reviews`, {
    params,
  });
  return data;
}

export async function deleteRideReview(reviewId) {
  const { data } = await api.delete(`/api/reviews/${reviewId}`);
  return data;
}