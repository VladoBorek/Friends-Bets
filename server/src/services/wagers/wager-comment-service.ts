import { eq } from "drizzle-orm";
import type { WagerCommentsListQuery } from "@pb138/shared/schemas/wager";
import { db } from "../../db/db";
import { User } from "../../db/schema";
import { HttpError } from "../../errors";
import {
  countCommentsByWager,
  createComment as repoCreateComment,
  listCommentsByWagerPaginated,
} from "../../repositories/wagers/comment-repository";
import { mapWagerComment, type WagerComment } from "./mappers/comment-mapper";
import { getWagerById } from "./wager-query-service";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "./wager-validation";

export async function listComments(
  wagerId: number,
  requestingUserId: number | undefined,
  query: WagerCommentsListQuery,
) {
  await getWagerById(wagerId, requestingUserId);

  const [total, rows] = await Promise.all([
    countCommentsByWager(wagerId),
    listCommentsByWagerPaginated(wagerId, query.limit, query.offset),
  ]);

  const data = rows.map(mapWagerComment);

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
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
    throw new HttpError(404, "NOT_FOUND", "User not found");
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