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

export function verifyCryptoToken(token: string, secret: string): number {
  let decoded: string;

  try {
    decoded = Buffer.from(token, "base64url").toString("utf-8");
  } catch {
    throw new HttpError(400, "BAD_REQUEST", "Invalid token format");
  }

  const [userIdText, expiresAtText, providedSignature] = decoded.split(":");
  const userId = Number(userIdText);
  const expiresAtMs = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAtMs) || !providedSignature) {
    throw new HttpError(400, "BAD_REQUEST", "Invalid token structure");
  }

  if (Date.now() > expiresAtMs) {
    throw new HttpError(400, "BAD_REQUEST", "Token expired");
  }

  const payload = `${userId}:${expiresAtMs}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (expectedSignature !== providedSignature) {
    throw new HttpError(400, "BAD_REQUEST", "Invalid token signature");
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