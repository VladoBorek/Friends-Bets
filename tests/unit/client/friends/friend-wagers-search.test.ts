import { describe, it, expect } from "vitest";
import { friendWagersSearchSchema } from "@client/features/friends/utils/friend-wagers-search";

describe("friendWagersSearchSchema", () => {
  describe("page field", () => {
    it("accepts a valid page number", () => {
      expect(friendWagersSearchSchema.parse({ page: 2 })).toEqual({ page: 2 });
    });

    it("coerces a numeric string to a number", () => {
      expect(friendWagersSearchSchema.parse({ page: "7" })).toEqual({ page: 7 });
    });

    it("falls back to 1 for a non-numeric string", () => {
      expect(friendWagersSearchSchema.parse({ page: "abc" })).toEqual({ page: 1 });
    });

    it("falls back to 1 for 0", () => {
      expect(friendWagersSearchSchema.parse({ page: 0 })).toEqual({ page: 1 });
    });

    it("falls back to 1 for a negative number", () => {
      expect(friendWagersSearchSchema.parse({ page: -3 })).toEqual({ page: 1 });
    });

    it("falls back to 1 when page is missing", () => {
      expect(friendWagersSearchSchema.parse({})).toEqual({ page: 1 });
    });

    it("falls back to 1 for a float", () => {
      expect(friendWagersSearchSchema.parse({ page: 2.9 })).toEqual({ page: 1 });
    });
  });
});
