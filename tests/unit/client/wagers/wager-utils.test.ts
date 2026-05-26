import { describe, expect, it } from "vitest";
import { BET_AMOUNT_ERROR_MESSAGE } from "@pb138/shared/schemas/wager";
import { WALLET_AMOUNT_ERROR_MESSAGE } from "@pb138/shared/schemas/wallet";
import {
  formatCurrency,
  formatMoney,
  statusColor,
  toErrorMessage,
  validateBetInput,
  validateWalletCreditInput,
} from "@client/features/wagers/utils/utils";

describe("wager utils", () => {
  describe("validation", () => {
    it("validates bet amounts with shared schema rules", () => {
      expect(validateBetInput(" ")).toBe(BET_AMOUNT_ERROR_MESSAGE);
      expect(validateBetInput("0.001")).toBe(BET_AMOUNT_ERROR_MESSAGE);
      expect(validateBetInput("5.25")).toBeNull();
    });

    it("validates wallet credit amounts with shared schema rules", () => {
      expect(validateWalletCreditInput(" ")).toBe(WALLET_AMOUNT_ERROR_MESSAGE);
      expect(validateWalletCreditInput("0.001")).toBe(BET_AMOUNT_ERROR_MESSAGE);
      expect(validateWalletCreditInput("10.00")).toBeNull();
    });
  });

  describe("formatting and status helpers", () => {
    it("formats money and currency values consistently", () => {
      expect(formatMoney(5)).toBe("5.00");
      expect(formatMoney("12.5")).toBe("12.50");
      expect(formatCurrency(8)).toBe("8.00");
    });

    it("returns stable status colors", () => {
      expect(statusColor("OPEN")).toContain("cyan");
      expect(statusColor("PENDING")).toContain("amber");
      expect(statusColor("CLOSED")).toContain("slate");
    });
  });

  describe("toErrorMessage", () => {
    it("extracts useful error messages from common response shapes", () => {
      expect(toErrorMessage({ response: { data: "Bad request" } })).toBe("Bad request");
      expect(
        toErrorMessage({ response: { data: { message: "Nope" } } }),
      ).toBe("Nope");
      expect(
        toErrorMessage({ response: { data: { issues: [{ message: "Invalid amount" }] } } }),
      ).toBe("Invalid amount");
      expect(toErrorMessage({ message: "Direct failure" })).toBe("Direct failure");
      expect(toErrorMessage(null)).toBe("Request failed");
    });
  });
});