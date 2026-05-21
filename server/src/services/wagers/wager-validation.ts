import { HttpError } from "../../errors";

export function ensureUserIsVerified(
  user: { isVerified?: boolean | null },
  action = "perform this action",
): void {
  if (user.isVerified === false) {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: `Account must be verified to ${action}.`,
    });
  }
}

export function ensureUserIsNotSuspended(
  user: { suspendedUntil?: string | null },
  action = "perform this action",
): void {
  if (!user.suspendedUntil) {
    return;
  }

  const suspensionEndsAt = new Date(user.suspendedUntil);
  if (Number.isNaN(suspensionEndsAt.getTime())) {
    return;
  }

  if (suspensionEndsAt.getTime() > Date.now()) {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: `Suspended users cannot ${action}`,
    });
  }
}