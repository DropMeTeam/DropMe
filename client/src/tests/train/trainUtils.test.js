import { describe, it, expect } from "vitest";
import {
  calculateTrainTotal,
  formatStationPair,
  formatDuration,
} from "../../lib/trainUtils";

describe("trainUtils", () => {
  it("calculates train total correctly", () => {
    expect(calculateTrainTotal(100, 2)).toBe(200);
  });

  it("formats station pair correctly", () => {
    expect(formatStationPair("Colombo Fort", "Kandy")).toBe("Colombo Fort → Kandy");
  });

  it("formats duration correctly", () => {
    expect(formatDuration(2, 30)).toBe("2h 30m");
  });

  it("formats duration with zero minutes correctly", () => {
    expect(formatDuration(1, 0)).toBe("1h 0m");
  });
});