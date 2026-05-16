import { describe, it, expect } from "vitest";
import { parseMoney, formatMoney, calculatePayout, calculateOdds } from "./wager-utils";

describe("parseMoney", () => {
  it("returns a number value unchanged", () => {
    expect(parseMoney(25.5)).toBe(25.5);
  });

  it("parses a valid numeric string", () => {
    expect(parseMoney("42.00")).toBe(42);
  });

  it("parses a negative string", () => {
    expect(parseMoney("-15.50")).toBe(-15.5);
  });

  it("returns 0 for null", () => {
    expect(parseMoney(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(parseMoney(undefined)).toBe(0);
  });

  it("returns 0 for an empty string", () => {
    expect(parseMoney("")).toBe(0);
  });

  it("returns 0 for a whitespace-only string", () => {
    expect(parseMoney("   ")).toBe(0);
  });

  it("returns 0 for the number 0", () => {
    expect(parseMoney(0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats an integer with two decimal places", () => {
    expect(formatMoney(100)).toBe("100.00");
  });

  it("formats a number with one decimal place", () => {
    expect(formatMoney(9.5)).toBe("9.50");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("0.00");
  });

  it("formats a negative number", () => {
    expect(formatMoney(-25)).toBe("-25.00");
  });

  it("rounds to two decimal places", () => {
    // 1.005 cannot be represented exactly in IEEE 754 — it stores as ~1.00499999,
    // so .toFixed(2) rounds it down to "1.00", not "1.01"
    expect(formatMoney(1.005)).toBe("1.00");
    expect(formatMoney(1.006)).toBe("1.01");
  });
});

describe("calculatePayout", () => {
  it("gives the sole winner the entire pool", () => {
    // One person bet 50, no one else bet — they win all 50
    expect(calculatePayout(50, 50, 50)).toBe(50);
  });

  it("gives a winner proportional share when losing side exists", () => {
    // Total pool: 100, winning pool: 40, this winner's stake: 10
    // Payout = (100 * 10) / 40 = 25
    expect(calculatePayout(100, 10, 40)).toBe(25);
  });

  it("distributes the full pool proportionally across equal stakes", () => {
    // Two equal winners each staked 50, total pool 100
    // Each payout = (100 * 50) / 100 = 50
    expect(calculatePayout(100, 50, 100)).toBe(50);
  });

  it("distributes the full pool proportionally across unequal stakes", () => {
    // Winning pool 60 (stakes: 40 + 20), total pool 150 (losing pool 90)
    // Larger winner: (150 * 40) / 60 = 100
    expect(calculatePayout(150, 40, 60)).toBe(100);
    // Smaller winner: (150 * 20) / 60 = 50
    expect(calculatePayout(150, 20, 60)).toBe(50);
  });

  it("rounds to two decimal places", () => {
    // (10 * 1) / 3 = 3.3333... → 3.33
    expect(calculatePayout(10, 1, 3)).toBe(3.33);
  });

  it("handles a large pool correctly", () => {
    // (10000 * 250) / 1000 = 2500
    expect(calculatePayout(10000, 250, 1000)).toBe(2500);
  });

  it("payout always includes the original stake", () => {
    // A winner always gets back at least what they staked (when totalPool >= winningPool)
    const stake = 30;
    const winningPool = 30;
    const totalPool = 100; // 70 from losers + 30 winning pool
    const payout = calculatePayout(totalPool, stake, winningPool);
    expect(payout).toBeGreaterThanOrEqual(stake);
  });
});

describe("calculateOdds", () => {
  it("returns the multiplier as a string with two decimal places", () => {
    // Pool 100, bet 40 → odds 2.50
    expect(calculateOdds(100, 40)).toBe("2.50");
  });

  it("returns 1.00 when the whole pool is on one outcome", () => {
    expect(calculateOdds(100, 100)).toBe("1.00");
  });

  it("returns null when totalPool is 0", () => {
    expect(calculateOdds(0, 40)).toBeNull();
  });

  it("returns null when totalBet is 0 (avoids division by zero)", () => {
    expect(calculateOdds(100, 0)).toBeNull();
  });

  it("returns null when both are 0", () => {
    expect(calculateOdds(0, 0)).toBeNull();
  });

  it("returns null for negative totalPool", () => {
    expect(calculateOdds(-10, 40)).toBeNull();
  });
});
