import bcrypt from "bcrypt";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { Role, User } from "../db/schema";
import type { CreateUserRequest, LoginRequest, UserSummary } from "../../../shared/src/schemas/user";
import { HttpError } from "../errors";
import { emailClient } from "./email-service";
import crypto from "node:crypto";
import { readServerConfig } from "../config";

type UserRow = {
  id: number;
  username: string;
  email: string;
  roleName: string | null;
  isVerified: boolean | null;
  suspendedUntil: Date | null;
  createdAt: Date | null;
};

function normalizeRoleName(roleName: unknown): string {
  if (typeof roleName !== "string" || roleName.trim().length === 0) {
    return "USER";
  }

  return roleName.toUpperCase();
}

function mapUserSummary(row: UserRow): UserSummary {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    roleName: normalizeRoleName(row.roleName),
    isVerified: row.isVerified ?? false,
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

function buildVerificationToken(userId: number): { token: string; expiresAtMs: number } {
  const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET ?? process.env.JWT_SECRET ?? "pb138-email-secret";
  const expiresAtMs = Date.now() + 1000 * 60 * 60 * 24;
  const payload = `${userId}:${expiresAtMs}`;
  const signature = crypto.createHmac("sha256", verificationSecret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`, "utf-8").toString("base64url");
  return { token, expiresAtMs };
}

function buildVerificationUrl(token: string): string {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
  return `${appOrigin}/verify-email?token=${encodeURIComponent(token)}`;
}

function buildPasswordResetToken(userId: number): { token: string; expiresAtMs: number } {
  const resetSecret = process.env.PASSWORD_RESET_SECRET ?? process.env.JWT_SECRET ?? "pb138-password-reset-secret";
  const expiresAtMs = Date.now() + 1000 * 60 * 60;
  const payload = `${userId}:${expiresAtMs}`;
  const signature = crypto.createHmac("sha256", resetSecret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`, "utf-8").toString("base64url");
  return { token, expiresAtMs };
}

function buildPasswordResetUrl(token: string): string {
  const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
  return `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function createUser(input: CreateUserRequest): Promise<UserSummary> {
  const [existingUser] = await db.select({ id: User.id }).from(User).where(eq(User.email, input.email)).limit(1);
  if (existingUser) {
    throw new HttpError(400, "Email already in use");
  }

  const [defaultRole] = await db
    .select({ id: Role.id })
    .from(Role)
    .where(inArray(Role.name, ["USER", "User", "PLAYER", "Player"]))
    .limit(1);

  if (!input.roleId && !defaultRole) {
    throw new HttpError(500, "Default role not configured");
  }

  const roleIdToUse = input.roleId ?? defaultRole!.id;

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [newUser] = await db
    .insert(User)
    .values({
      username: input.username,
      email: input.email,
      password_hash: passwordHash,
      role_id: roleIdToUse,
      is_verified: false,
    })
    .returning();

  const createdUser = await getUserById(newUser.id);
  const { token, expiresAtMs } = buildVerificationToken(createdUser.id);
  const verificationUrl = buildVerificationUrl(token);

  try {
    await emailClient.sendRegistrationEmail({
      email: createdUser.email,
      username: createdUser.username,
      activationUrl: verificationUrl,
    });
    console.log("[Users] Registration verification email sent", {
      userId: createdUser.id,
      email: createdUser.email,
      expiresAtIso: new Date(expiresAtMs).toISOString(),
    });
  } catch (error) {
    console.error("[Users] Registration verification email failed", {
      userId: createdUser.id,
      email: createdUser.email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpError(
      500,
      `User created, but verification email failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  return createdUser;
}

export async function getUserByCredentials(input: LoginRequest): Promise<UserSummary> {
  const [user] = await db
    .select({
      id: User.id,
      username: User.username,
      email: User.email,
      passwordHash: User.password_hash,
      roleId: User.role_id,
      roleName: Role.name,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.email, input.email))
    .limit(1);

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  return mapUserSummary(user);
}

export async function getUserById(id: number): Promise<UserSummary> {
  const [user] = await db
    .select({
      id: User.id,
      username: User.username,
      email: User.email,
      roleName: Role.name,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.id, id))
    .limit(1);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return mapUserSummary(user);
}

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await db
    .select({
      id: User.id,
      username: User.username,
      email: User.email,
      roleName: Role.name,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .orderBy(desc(User.created_at));

  return rows.map(mapUserSummary);
}

export async function getUserByEmail(email: string): Promise<UserSummary> {
  const [user] = await db
    .select({
      id: User.id,
      username: User.username,
      email: User.email,
      roleName: Role.name,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.email, email))
    .limit(1);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return mapUserSummary(user);
}

export async function updateUserRole(userId: number, roleName: "ADMIN" | "PLAYER" | "USER"): Promise<UserSummary> {
  const [role] = await db
    .select({ id: Role.id })
    .from(Role)
    .where(inArray(Role.name, [roleName, roleName.toLowerCase(), roleName.charAt(0) + roleName.slice(1).toLowerCase()]))
    .limit(1);

  if (!role) {
    throw new HttpError(400, `Role ${roleName} is not configured`);
  }

  const [updated] = await db
    .update(User)
    .set({ role_id: role.id })
    .where(eq(User.id, userId))
    .returning({ id: User.id });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  return getUserById(userId);
}

export async function suspendUser(
  userId: number,
  durationValue: number,
  durationUnit: "hours" | "days" | "months",
): Promise<UserSummary> {
  const suspensionUntil = new Date();

  if (durationUnit === "hours") {
    suspensionUntil.setHours(suspensionUntil.getHours() + durationValue);
  } else if (durationUnit === "days") {
    suspensionUntil.setDate(suspensionUntil.getDate() + durationValue);
  } else {
    suspensionUntil.setMonth(suspensionUntil.getMonth() + durationValue);
  }

  const [updated] = await db
    .update(User)
    .set({ suspended_until: suspensionUntil })
    .where(eq(User.id, userId))
    .returning({ id: User.id });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  const user = await getUserById(userId);
  if (user.suspendedUntil) {
    await emailClient.sendSuspensionEmail({
      email: user.email,
      username: user.username,
      suspendedUntilIso: user.suspendedUntil,
    });
  }

  // TODO: Enforce suspended_until in wager betting endpoints once bet placement flow is finalized.
  return user;
}

export async function unsuspendUser(userId: number): Promise<UserSummary> {
  const [updated] = await db
    .update(User)
    .set({ suspended_until: null })
    .where(eq(User.id, userId))
    .returning({ id: User.id });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  return getUserById(userId);
}

export async function deleteUser(userId: number): Promise<void> {
  const [deleted] = await db.delete(User).where(eq(User.id, userId)).returning({ id: User.id });
  if (!deleted) {
    throw new HttpError(404, "User not found");
  }
}

export async function resendVerificationEmail(userId: number): Promise<void> {
  const emailConfig = readServerConfig().email;
  console.log("[Users] Resend verification requested", {
    userId,
    emailEnabled: emailConfig.enabled,
    emailProvider: emailConfig.provider,
    appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  });

  if (!emailConfig.enabled) {
    throw new HttpError(
      400,
      "Email delivery is disabled. Set EMAIL_ENABLED=true.",
    );
  }

  const user = await getUserById(userId);
  if (user.isVerified) {
    throw new HttpError(400, "User is already verified");
  }

  const { token, expiresAtMs } = buildVerificationToken(user.id);
  const verificationUrl = buildVerificationUrl(token);

  console.log("[Users] Sending verification reminder", {
    userId: user.id,
    email: user.email,
    username: user.username,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
    emailProvider: emailConfig.provider,
  });

  try {
    await emailClient.sendVerificationReminderEmail({
      email: user.email,
      username: user.username,
      verificationUrl,
    });
    console.log("[Users] Verification reminder send completed", { userId: user.id, email: user.email });
  } catch (error) {
    console.error("[Users] Verification reminder send failed", {
      userId: user.id,
      email: user.email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpError(500, `Failed to send verification email: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

export async function resendVerificationEmailByAddress(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  await resendVerificationEmail(user.id);
}

export async function sendAdminPasswordReset(userId: number): Promise<void> {
  const user = await getUserById(userId);
  const { token, expiresAtMs } = buildPasswordResetToken(user.id);
  const resetUrl = buildPasswordResetUrl(token);

  await emailClient.sendPasswordResetEmail({
    email: user.email,
    username: user.username,
    resetUrl,
  });

  console.log("[Users] Admin password reset email sent", {
    userId: user.id,
    email: user.email,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  });
}

export async function resetPasswordByToken(token: string, password: string): Promise<void> {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf-8");
  } catch {
    throw new HttpError(400, "Invalid password reset token");
  }

  const [userIdText, expiresAtText, providedSignature] = decoded.split(":");
  const userId = Number(userIdText);
  const expiresAtMs = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAtMs) || !providedSignature) {
    throw new HttpError(400, "Invalid password reset token");
  }

  if (Date.now() > expiresAtMs) {
    throw new HttpError(400, "Password reset token expired");
  }

  const resetSecret = process.env.PASSWORD_RESET_SECRET ?? process.env.JWT_SECRET ?? "pb138-password-reset-secret";
  const payload = `${userId}:${expiresAtMs}`;
  const expectedSignature = crypto.createHmac("sha256", resetSecret).update(payload).digest("hex");
  if (expectedSignature !== providedSignature) {
    throw new HttpError(400, "Invalid password reset token");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [updated] = await db
    .update(User)
    .set({ password_hash: passwordHash })
    .where(eq(User.id, userId))
    .returning({ id: User.id, email: User.email, username: User.username });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  await emailClient.sendPasswordChangedEmail({
    email: updated.email,
    username: updated.username,
    changedAtIso: new Date().toISOString(),
  });
}

export async function verifyEmailToken(token: string): Promise<UserSummary> {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf-8");
  } catch {
    throw new HttpError(400, "Invalid verification token");
  }

  const [userIdText, expiresAtText, providedSignature] = decoded.split(":");
  const userId = Number(userIdText);
  const expiresAtMs = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAtMs) || !providedSignature) {
    throw new HttpError(400, "Invalid verification token");
  }

  if (Date.now() > expiresAtMs) {
    throw new HttpError(400, "Verification token expired");
  }

  const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET ?? process.env.JWT_SECRET ?? "pb138-email-secret";
  const payload = `${userId}:${expiresAtMs}`;
  const expectedSignature = crypto.createHmac("sha256", verificationSecret).update(payload).digest("hex");
  if (expectedSignature !== providedSignature) {
    throw new HttpError(400, "Invalid verification token");
  }

  const [updated] = await db
    .update(User)
    .set({ is_verified: true })
    .where(eq(User.id, userId))
    .returning({ id: User.id });

  if (!updated) {
    throw new HttpError(404, "User not found");
  }

  return getUserById(userId);
}
