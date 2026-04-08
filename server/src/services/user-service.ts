import bcrypt from "bcrypt";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { Role, User } from "../db/schema";
import type { CreateUserRequest, LoginRequest, UserSummary } from "../../../shared/src/schemas/user";
import { HttpError } from "../errors";
import { emailClient } from "./email-service";

type UserRow = {
  id: number;
  username: string;
  email: string;
  roleName: string | null;
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
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
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
    })
    .returning();

  return getUserById(newUser.id);
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
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .orderBy(desc(User.created_at));

  return rows.map(mapUserSummary);
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

export async function deleteUser(userId: number): Promise<void> {
  const [deleted] = await db.delete(User).where(eq(User.id, userId)).returning({ id: User.id });
  if (!deleted) {
    throw new HttpError(404, "User not found");
  }
}
