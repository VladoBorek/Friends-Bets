import { describe, expect, it } from "vitest";
import { HttpError } from "@server/errors";
import {
  formatMoney,
  mapTransactionToHistoryItem,
  normalizePositiveAmount,
} from "@server/services/wallet/wallet-utils";

describe("wallet-utils", () => {
  describe("normalizePositiveAmount", () => {
    it("rounds positive amounts to two decimals", () => {
      expect(normalizePositiveAmount(12.345)).toBe(12.35);
    });

    it("rejects zero, negative, and non-finite values", () => {
      expect(() => normalizePositiveAmount(0)).toThrowError(HttpError);
      expect(() => normalizePositiveAmount(-1)).toThrowError(HttpError);
      expect(() => normalizePositiveAmount(Number.NaN)).toThrowError(HttpError);
      expect(() => normalizePositiveAmount(Number.POSITIVE_INFINITY)).toThrowError(HttpError);
    });
  });

  describe("formatMoney", () => {
    it("formats values using two decimal places", () => {
      expect(formatMoney(5)).toBe("5.00");
      expect(formatMoney(5.5)).toBe("5.50");
    });
  });

  describe("mapTransactionToHistoryItem", () => {
    it("maps wallet deposits into readable history items", () => {
      expect(
        mapTransactionToHistoryItem({
          id: 1,
          wagerId: null,
          type: "deposit",
          amount: "25.5",
          wagerName: null,
          outcomeName: null,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        }),
      ).toEqual({
        id: 1,
        wagerId: null,
        wagerName: "Wallet deposit",
        type: "deposit",
        outcome: "Funds added",
        walletImpact: "+25.50",
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("maps wallet withdrawals and wager transactions with their original labels", () => {
      expect(
        mapTransactionToHistoryItem({
          id: 2,
          wagerId: null,
          type: "withdraw",
          amount: "-10.00",
          wagerName: null,
          outcomeName: null,
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
        }),
      ).toEqual({
        id: 2,
        wagerId: null,
        wagerName: "Wallet withdrawal",
        type: "withdraw",
        outcome: "Funds removed",
        walletImpact: "-10.00",
        timestamp: "2024-01-02T00:00:00.000Z",
      });

      expect(
        mapTransactionToHistoryItem({
          id: 3,
          wagerId: 9,
          type: "bet",
          amount: "-15.00",
          wagerName: "Grand Final",
          outcomeName: "Team A wins",
          createdAt: new Date("2024-01-03T00:00:00.000Z"),
        }),
      ).toEqual({
        id: 3,
        wagerId: 9,
        wagerName: "Grand Final",
        type: "bet",
        outcome: "Team A wins",
        walletImpact: "-15.00",
        timestamp: "2024-01-03T00:00:00.000Z",
      });
    });
  });
});