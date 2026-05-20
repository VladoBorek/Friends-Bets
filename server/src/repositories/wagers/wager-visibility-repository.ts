import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { User, WagerVisibility } from "../../db/schema";

export async function findWagerVisibility(
  wagerId: number,
  userId: number,
): Promise<{ id: number } | null> {
  const [row] = await db
    .select({ id: WagerVisibility.id })
    .from(WagerVisibility)
    .where(and(eq(WagerVisibility.wager_id, wagerId), eq(WagerVisibility.user_id, userId)))
    .limit(1);

  return row ?? null;
}

export async function deleteWagerVisibilities(wagerId: number): Promise<void> {
  await db.delete(WagerVisibility).where(eq(WagerVisibility.wager_id, wagerId));
}

export async function countWagerVisibilityUsers(wagerId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(WagerVisibility)
    .where(eq(WagerVisibility.wager_id, wagerId));

  return Number(row?.count ?? 0);
}

export async function listWagerVisibilityUsersPaginated(
  wagerId: number,
  limit: number,
  offset: number,
): Promise<{ id: number; username: string; email: string }[]> {
  return db
    .select({ id: User.id, username: User.username, email: User.email })
    .from(WagerVisibility)
    .innerJoin(User, eq(WagerVisibility.user_id, User.id))
    .where(eq(WagerVisibility.wager_id, wagerId))
    .orderBy(User.email)
    .limit(limit)
    .offset(offset);
}

export async function listWagerVisibilityUsers(
  wagerId: number,
): Promise<{ id: number; username: string; email: string }[]> {
  return db
    .select({ id: User.id, username: User.username, email: User.email })
    .from(WagerVisibility)
    .innerJoin(User, eq(WagerVisibility.user_id, User.id))
    .where(eq(WagerVisibility.wager_id, wagerId))
    .orderBy(User.email);
}

export async function createWagerVisibilities(
  wagerId: number,
  userIds: number[],
): Promise<void> {
  if (userIds.length === 0) return;

  await db.insert(WagerVisibility).values(
    userIds.map((userId) => ({
      wager_id: wagerId,
      user_id: userId,
    })),
  );
}