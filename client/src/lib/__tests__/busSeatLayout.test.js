import { describe, it, expect } from "vitest";
import {
  isValidSeatCount,
  getBusLayoutType,
  getRearRowSeatCount,
  getNormalEntranceSeatCount,
  buildSeatLayout,
} from "../busSeatLayout.js";

describe("busSeatLayout frontend unit tests", () => {
  it("accepts valid seat count", () => {
    expect(isValidSeatCount("Normal", 42)).toBe(true);
  });

  it("rejects invalid seat count", () => {
    expect(isValidSeatCount("Normal", 40)).toBe(false);
  });

  it("returns 2x3 layout for Normal 49", () => {
    expect(getBusLayoutType("Normal", 49)).toBe("2x3");
  });

  it("returns 2x2 layout for Normal 42", () => {
    expect(getBusLayoutType("Normal", 42)).toBe("2x2");
  });

  it("returns correct rear row seat count", () => {
    expect(getRearRowSeatCount("Luxury", 50)).toBe(6);
  });

  it("returns correct entrance seat count for Normal 49", () => {
    expect(getNormalEntranceSeatCount("Normal", 49)).toBe(3);
  });

  it("returns correct entrance seat count for Normal 42", () => {
    expect(getNormalEntranceSeatCount("Normal", 42)).toBe(2);
  });

  it("returns zero entrance seats for non-Normal buses", () => {
    expect(getNormalEntranceSeatCount("Luxury", 45)).toBe(0);
  });

  it("builds a valid layout with rows", () => {
    const layout = buildSeatLayout("Normal", 42);

    expect(layout.totalSeats).toBe(42);
    expect(layout.rows.length).toBeGreaterThan(0);
  });

  it("returns empty rows for invalid seat config", () => {
    const layout = buildSeatLayout("Normal", 41);

    expect(layout.rows).toEqual([]);
  });

  it("includes rear row in valid layout", () => {
    const layout = buildSeatLayout("Expressway", 50);

    expect(layout.rows.some((row) => row.kind === "rear")).toBe(true);
  });

  it("includes entrance row only for Normal buses", () => {
    const normalLayout = buildSeatLayout("Normal", 42);
    const luxuryLayout = buildSeatLayout("Luxury", 45);

    expect(normalLayout.rows.some((row) => row.kind === "entrance")).toBe(true);
    expect(luxuryLayout.rows.some((row) => row.kind === "entrance")).toBe(false);
  });
});