import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../../lib/api";
import {
  getTrainStations,
  getTrainScheduleDetails,
  createTrainBooking,
  getMyTrainBookings,
  cancelMyTrainBooking,
  createTrainStripeSession,
  verifyTrainStripePayment,
} from "../../lib/trainPassengerApi";

vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("trainPassengerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets train stations", async () => {
    api.get.mockResolvedValue({ data: { stations: [] } });

    const result = await getTrainStations();

    expect(api.get).toHaveBeenCalledWith("/api/train/stations");
    expect(result).toEqual({ stations: [] });
  });

  it("gets train schedule details with params", async () => {
    api.get.mockResolvedValue({ data: { schedule: { _id: "1" } } });

    const result = await getTrainScheduleDetails("123", { day: "Mon" });

    expect(api.get).toHaveBeenCalledWith("/api/train/schedules/123", {
      params: { day: "Mon" },
    });
    expect(result).toEqual({ schedule: { _id: "1" } });
  });

  it("creates train booking", async () => {
    const payload = { scheduleId: "abc", seats: 2 };
    api.post.mockResolvedValue({ data: { bookingId: "b1" } });

    const result = await createTrainBooking(payload);

    expect(api.post).toHaveBeenCalledWith("/api/train/bookings/checkout", payload);
    expect(result).toEqual({ bookingId: "b1" });
  });

  it("gets my train bookings", async () => {
    api.get.mockResolvedValue({ data: { bookings: [] } });

    const result = await getMyTrainBookings();

    expect(api.get).toHaveBeenCalledWith("/api/train/bookings/mine");
    expect(result).toEqual({ bookings: [] });
  });

  it("cancels my train booking", async () => {
    api.patch.mockResolvedValue({ data: { success: true } });

    const result = await cancelMyTrainBooking("bk123");

    expect(api.patch).toHaveBeenCalledWith("/api/train/bookings/bk123/cancel");
    expect(result).toEqual({ success: true });
  });

  it("creates train stripe session", async () => {
    api.post.mockResolvedValue({ data: { url: "stripe-url" } });

    const result = await createTrainStripeSession("bk123");

    expect(api.post).toHaveBeenCalledWith("/api/payments/stripe/train/session", {
      bookingId: "bk123",
    });
    expect(result).toEqual({ url: "stripe-url" });
  });

  it("verifies train stripe payment", async () => {
    api.get.mockResolvedValue({ data: { verified: true } });

    const result = await verifyTrainStripePayment({
      bookingId: "bk123",
      sessionId: "sess_1",
    });

    expect(api.get).toHaveBeenCalledWith("/api/payments/stripe/train/verify", {
      params: {
        bookingId: "bk123",
        session_id: "sess_1",
      },
    });
    expect(result).toEqual({ verified: true });
  });
});