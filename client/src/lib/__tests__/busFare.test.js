import { describe, it, expect } from "vitest";
import { calculateBusFare, formatLkr } from "../busFare.js";

describe("busFare frontend unit tests", () => {
  it("calculates Normal fare correctly", () => {
    const result = calculateBusFare({ busType: "Normal", distanceKm: 10 });

    expect(result.fareLkr).toBe(65);
    expect(result.distanceKm).toBe(10);
  });

  it("calculates Luxury fare correctly", () => {
    const result = calculateBusFare({ busType: "Luxury", distanceKm: 10 });

    expect(result.fareLkr).toBe(105);
    expect(result.distanceKm).toBe(10);
  });

  it("rounds fare up to nearest 5", () => {
    const result = calculateBusFare({ busType: "Semi-luxury", distanceKm: 3 });

    expect(result.fareLkr % 5).toBe(0);
  });

  it("uses minimum fare when distance is negative", () => {
    const result = calculateBusFare({ busType: "Normal", distanceKm: -5 });

    expect(result.distanceKm).toBe(0);
    expect(result.fareLkr).toBe(35);
  });

  it("falls back to Normal rule for unknown bus type", () => {
    const result = calculateBusFare({ busType: "Unknown", distanceKm: 10 });

    expect(result.fareLkr).toBe(65);
  });

  it("rounds distance to one decimal place", () => {
    const result = calculateBusFare({ busType: "Expressway", distanceKm: 12.345 });

    expect(result.distanceKm).toBe(12.3);
  });

  it("formats LKR correctly", () => {
    expect(formatLkr(1250)).toBe("LKR 1,250");
  });

  it("formats invalid amount as zero", () => {
    expect(formatLkr(undefined)).toBe("LKR 0");
  });
});