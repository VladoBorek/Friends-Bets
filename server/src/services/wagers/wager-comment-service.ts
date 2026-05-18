import { db } from "../../db/db";
import { User } from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  listCommentsByWager,
  createComment as repoCreateComment,
} from "../../repositories/wagers/comment-repository";
import { HttpError } from "../../errors";
import { mapWagerComment, type WagerComment } from "./mappers/comment-mapper";
import { getWagerById } from "./wager-query-service";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "./wager-validation";

export async function listComments(wagerId: number, requestingUserId?: number): Promise<WagerComment[]> {
  await getWagerById(wagerId, requestingUserId);

  const rows = await listCommentsByWager(wagerId);
  return rows.map(mapWagerComment);
}

export async function createComment(
  wagerId: number,
  userId: number,
  content: string,
): Promise<WagerComment> {
  await getWagerById(wagerId, userId);

  const [commentingUser] = await db
    .select({
      username: User.username,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
    })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  if (!commentingUser) {
    throw new HttpError(404, "User not found");
  }

  ensureUserIsVerified(commentingUser, "comment");
  ensureUserIsNotSuspended(
    { suspendedUntil: commentingUser.suspendedUntil?.toISOString() ?? null },
    "comment",
  );

  const commentRow = await repoCreateComment({
    wagerId,
    userId,
    content,
  });

  return {
    id: commentRow.id,
    userId,
    username: commentingUser.username,
    content,
    createdAt: (commentRow.createdAt ?? new Date()).toISOString(),
  };
}
