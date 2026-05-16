import { and, eq } from "drizzle-orm";
import { db } from "../db/db";
import { WagerVisibility } from "../db/schema";

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
