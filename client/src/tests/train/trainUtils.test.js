import { describe, it, expect } from "vitest";
import {
  calculateTrainTotal,
  formatStationPair,
  formatDuration,
} from "../../lib/trainUtils";

describe("train utils", () => {
  it("calculates train total correctly", () => {
    expect(calculateTrainTotal(100, 2)).toBe(200);
  });

  it("formats station pair correctly", () => {
    expect(formatStationPair("Maradana", "Galle")).toBe("Maradana → Galle");
  });

  it("formats duration correctly", () => {
    expect(formatDuration(2, 30)).toBe("2h 30m");
  });
});