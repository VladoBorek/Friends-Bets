import { and, desc, eq, ilike, inArray, ne } from "drizzle-orm";
import { db } from "../db/db";
import { Role, User, Wallet } from "../db/schema";
import type { CreateUserRequest } from "@pb138/shared/schemas/user";

export type UserRow = {
  id: number;
  username: string;
  email: string;
  roleName: string | null;
  isVerified: boolean | null;
  suspendedUntil: Date | null;
  createdAt: Date | null;
};

export type FullUserRow = UserRow & {
  passwordHash: string;
};

const userSelect = {
  id: User.id,
  username: User.username,
  email: User.email,
  roleName: Role.name,
  isVerified: User.is_verified,
  suspendedUntil: User.suspended_until,
  createdAt: User.created_at,
};

export async function findUserById(id: number): Promise<UserRow | null> {
  const [row] = await db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.id, id))
    .limit(1);

  return row ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [row] = await db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.email, email))
    .limit(1);

  return row ?? null;
}

export async function findUserWithPasswordByEmail(email: string): Promise<FullUserRow | null> {
  const [row] = await db
    .select({
      ...userSelect,
      passwordHash: User.password_hash,
    })
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(eq(User.email, email))
    .limit(1);

  return row ?? null;
}

export async function listAllUsers(): Promise<UserRow[]> {
  return db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .orderBy(desc(User.created_at));
}

export async function searchUsersByEmailPrefix(
  emailQuery: string,
  excludeUserId: number,
  limit: number = 10,
): Promise<UserRow[]> {
  return db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(and(ilike(User.email, `${emailQuery}%`), ne(User.id, excludeUserId)))
    .limit(limit);
}

export async function createUserWithWallet(
  input: CreateUserRequest,
  passwordHash: string,
  roleId: number,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(User)
      .values({
        username: input.username,
        email: input.email,
        password_hash: passwordHash,
        role_id: roleId,
        is_verified: false,
      })
      .returning({ id: User.id });

    await tx.insert(Wallet).values({
      user_id: createdUser.id,
      balance: "100.00",
    });

    return createdUser.id;
  });
}

export async function updateUserRoleById(userId: number, roleId: number): Promise<void> {
  await db.update(User).set({ role_id: roleId }).where(eq(User.id, userId));
}

export async function updateUserSuspension(userId: number, suspendedUntil: Date | null): Promise<void> {
  await db.update(User).set({ suspended_until: suspendedUntil }).where(eq(User.id, userId));
}

export async function updateUserVerification(userId: number, isVerified: boolean): Promise<void> {
  await db.update(User).set({ is_verified: isVerified }).where(eq(User.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await db.update(User).set({ password_hash: passwordHash }).where(eq(User.id, userId));
}

export async function deleteUserById(userId: number): Promise<void> {
  await db.delete(User).where(eq(User.id, userId));
}

export async function findRoleIdByName(roleName: string): Promise<number | null> {
  const [role] = await db
    .select({ id: Role.id })
    .from(Role)
    .where(inArray(Role.name, [roleName, roleName.toLowerCase(), roleName.charAt(0) + roleName.slice(1).toLowerCase()]))
    .limit(1);

  return role?.id ?? null;
}
