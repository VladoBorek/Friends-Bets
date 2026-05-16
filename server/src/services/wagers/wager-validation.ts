import { HttpError } from "../../errors";

export function ensureUserIsVerified(user: { isVerified?: boolean | null }): void {
  if (user.isVerified === false) {
    throw new HttpError(403, "Account must be verified to perform this action.");
  }
}

export function ensureUserIsNotSuspended(user: { suspendedUntil?: string | null }): void {
  if (!user.suspendedUntil) {
    return;
  }

  const suspensionEndsAt = new Date(user.suspendedUntil);
  if (Number.isNaN(suspensionEndsAt.getTime())) {
    return;
  }

  if (suspensionEndsAt.getTime() > Date.now()) {
    throw new HttpError(403, "Suspended users cannot perform this action");
  }
}
