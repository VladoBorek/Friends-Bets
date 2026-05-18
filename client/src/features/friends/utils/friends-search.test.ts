import { describe, it, expect } from "vitest";
import { friendsSearchSchema, FRIENDS_PAGE_SIZE } from "./friends-search";

describe("friendsSearchSchema", () => {
  describe("page field", () => {
    it("accepts a valid page number", () => {
      expect(friendsSearchSchema.parse({ page: 3 })).toEqual({ page: 3 });
    });

    it("coerces a numeric string to a number", () => {
      expect(friendsSearchSchema.parse({ page: "5" })).toEqual({ page: 5 });
    });

    it("falls back to 1 for a non-numeric string", () => {
      expect(friendsSearchSchema.parse({ page: "abc" })).toEqual({ page: 1 });
    });

    it("falls back to 1 for 0", () => {
      expect(friendsSearchSchema.parse({ page: 0 })).toEqual({ page: 1 });
    });

    it("falls back to 1 for a negative number", () => {
      expect(friendsSearchSchema.parse({ page: -5 })).toEqual({ page: 1 });
    });

    it("falls back to 1 when page is missing", () => {
      expect(friendsSearchSchema.parse({})).toEqual({ page: 1 });
    });

    it("falls back to 1 for a float", () => {
      expect(friendsSearchSchema.parse({ page: 1.5 })).toEqual({ page: 1 });
    });
  });

  describe("FRIENDS_PAGE_SIZE", () => {
    it("is 5", () => {
      expect(FRIENDS_PAGE_SIZE).toBe(5);
    });
  });
});
