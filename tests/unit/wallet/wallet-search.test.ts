import { describe, it, expect } from "vitest";
import { walletSearchSchema } from "@client/features/wallet/utils/wallet-search";

describe("walletSearchSchema", () => {
  describe("page field", () => {
    it("preserves a valid page number", () => {
      const result = walletSearchSchema.parse({ page: 3 });
      expect(result.page).toBe(3);
    });

    it("coerces a numeric string to a number", () => {
      const result = walletSearchSchema.parse({ page: "5" });
      expect(result.page).toBe(5);
    });

    it("falls back to 1 when page is a non-numeric string", () => {
      const result = walletSearchSchema.parse({ page: "abc" });
      expect(result.page).toBe(1);
    });

    it("falls back to 1 when page is zero", () => {
      const result = walletSearchSchema.parse({ page: 0 });
      expect(result.page).toBe(1);
    });

    it("falls back to 1 when page is negative", () => {
      const result = walletSearchSchema.parse({ page: -5 });
      expect(result.page).toBe(1);
    });

    it("falls back to 1 when page is missing", () => {
      const result = walletSearchSchema.parse({});
      expect(result.page).toBe(1);
    });
  });

  describe("type field", () => {
    it("defaults to ALL when type is missing", () => {
      const result = walletSearchSchema.parse({});
      expect(result.type).toBe("ALL");
    });

    it("preserves a provided type value", () => {
      const result = walletSearchSchema.parse({ type: "bet" });
      expect(result.type).toBe("bet");
    });
  });

  describe("search field", () => {
    it("defaults to empty string when search is missing", () => {
      const result = walletSearchSchema.parse({});
      expect(result.search).toBe("");
    });

    it("preserves a provided search value", () => {
      const result = walletSearchSchema.parse({ search: "world cup" });
      expect(result.search).toBe("world cup");
    });
  });
});
