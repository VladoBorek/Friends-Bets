import crypto from "node:crypto";
import { readServerConfig } from "../../config";
import { HttpError } from "../../errors";

export function generateCryptoToken(
  userId: number,
  secret: string,
  expirationMs: number,
): { token: string; expiresAtMs: number } {
  const expiresAtMs = Date.now() + expirationMs;
  const payload = `${userId}:${expiresAtMs}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`, "utf-8").toString("base64url");

  return { token, expiresAtMs };
}

function invalidTokenError(): HttpError {
  return new HttpError({
    status: 400,
    code: "TOKEN_INVALID",
    message: "Invalid or expired token",
  });
}

export function verifyCryptoToken(token: string, secret: string): number {
  let decoded: string;

  try {
    decoded = Buffer.from(token, "base64url").toString("utf-8");
  } catch {
    throw invalidTokenError();
  }

  const [userIdText, expiresAtText, providedSignature] = decoded.split(":");
  const userId = Number(userIdText);
  const expiresAtMs = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAtMs) || !providedSignature) {
    throw invalidTokenError();
  }

  if (Date.now() > expiresAtMs) {
    throw new HttpError({
      status: 400,
      code: "TOKEN_EXPIRED",
      message: "Invalid or expired token",
    });
  }

  const payload = `${userId}:${expiresAtMs}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
  const providedSignatureBuffer = Buffer.from(providedSignature, "hex");

  if (
    expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
    !crypto.timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
  ) {
    throw invalidTokenError();
  }

  return userId;
}

export function buildVerificationToken(userId: number): { token: string; expiresAtMs: number } {
  const secret = readServerConfig().secrets.emailVerification;

  return generateCryptoToken(userId, secret, 1000 * 60 * 60 * 24);
}

export function buildVerificationUrl(token: string): string {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";

  return `${appOrigin}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetToken(userId: number): { token: string; expiresAtMs: number } {
  const secret = readServerConfig().secrets.passwordReset;

  return generateCryptoToken(userId, secret, 1000 * 60 * 60);
}

export function buildPasswordResetUrl(token: string): string {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";

  return `${appOrigin}/auth/reset-password?token=${encodeURIComponent(token)}`;
}