import { describe, expect, it } from "vitest";
import { HttpError } from "@server/errors";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "@server/services/wagers/wager-validation";

describe("wager-validation", () => {
  describe("ensureUserIsVerified", () => {
    it("throws a clear comment-specific error for unverified users", () => {
      expect(() => ensureUserIsVerified({ isVerified: false }, "comment")).toThrowError(HttpError);
      expect(() => ensureUserIsVerified({ isVerified: false }, "comment")).toThrow(
        "Account must be verified to comment.",
      );
    });

    it("uses the default action text when none is provided", () => {
      expect(() => ensureUserIsVerified({ isVerified: false })).toThrow(
        "Account must be verified to perform this action.",
      );
    });

    it("allows verified users", () => {
      expect(() => ensureUserIsVerified({ isVerified: true }, "comment")).not.toThrow();
    });
  });

  describe("ensureUserIsNotSuspended", () => {
    it("throws a clear comment-specific error for actively suspended users", () => {
      const futureDate = new Date(Date.now() + 60_000).toISOString();
      expect(() => ensureUserIsNotSuspended({ suspendedUntil: futureDate }, "comment")).toThrowError(HttpError);
      expect(() => ensureUserIsNotSuspended({ suspendedUntil: futureDate }, "comment")).toThrow(
        "Suspended users cannot comment",
      );
    });

    it("allows users whose suspension expired", () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      expect(() => ensureUserIsNotSuspended({ suspendedUntil: pastDate }, "comment")).not.toThrow();
    });

    it("ignores invalid suspension timestamps", () => {
      expect(() => ensureUserIsNotSuspended({ suspendedUntil: "not-a-date" }, "comment")).not.toThrow();
    });
  });
});