import { describe, it, expect } from "vitest";
import {
  calculatePrivateFare,
  hasAvailableSeats,
  getRideStatusLabel,
} from "../../lib/privateTransportUtils";

describe("privateTransportUtils", () => {
  it("calculates private fare correctly", () => {
    expect(calculatePrivateFare(200, 50, 10)).toBe(700);
  });

  it("returns true when seats are available", () => {
    expect(hasAvailableSeats(4, 2)).toBe(true);
  });

  it("returns false when no seats are available", () => {
    expect(hasAvailableSeats(4, 4)).toBe(false);
  });

  it("returns correct ride status label", () => {
    expect(getRideStatusLabel("confirmed")).toBe("Confirmed");
  });

  it("returns Unknown for invalid status", () => {
    expect(getRideStatusLabel("random")).toBe("Unknown");
  });
});