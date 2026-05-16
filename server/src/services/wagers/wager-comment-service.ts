import { db } from "../../db/db";
import { User } from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  listCommentsByWager,
  createComment as repoCreateComment,
} from "../../repositories/comment-repository";
import { mapWagerComment, type WagerComment } from "./mappers/comment-mapper";
import { getWagerById } from "./wager-query-service";

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

  const commentRow = await repoCreateComment({
    wagerId,
    userId,
    content,
  });

  const [user] = await db.select({ username: User.username }).from(User).where(eq(User.id, userId)).limit(1);

  return {
    id: commentRow.id,
    userId,
    username: user?.username ?? "Unknown",
    content,
    createdAt: (commentRow.createdAt ?? new Date()).toISOString(),
  };
}
