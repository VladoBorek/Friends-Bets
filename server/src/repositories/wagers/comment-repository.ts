import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { Comment, User } from "../../db/schema";

export type CommentRow = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: Date | null;
};

export async function countCommentsByWager(wagerId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(Comment)
    .where(eq(Comment.wager_id, wagerId));

  return Number(row?.count ?? 0);
}

export async function listCommentsByWagerPaginated(
  wagerId: number,
  limit: number,
  offset: number,
): Promise<CommentRow[]> {
  return db
    .select({
      id: Comment.id,
      userId: User.id,
      username: User.username,
      content: Comment.content,
      createdAt: Comment.created_at,
    })
    .from(Comment)
    .innerJoin(User, eq(Comment.user_id, User.id))
    .where(eq(Comment.wager_id, wagerId))
    .orderBy(asc(Comment.created_at))
    .limit(limit)
    .offset(offset);
}

export async function listCommentsByWager(wagerId: number): Promise<CommentRow[]> {
  return db
    .select({
      id: Comment.id,
      userId: User.id,
      username: User.username,
      content: Comment.content,
      createdAt: Comment.created_at,
    })
    .from(Comment)
    .innerJoin(User, eq(Comment.user_id, User.id))
    .where(eq(Comment.wager_id, wagerId))
    .orderBy(asc(Comment.created_at));
}

export async function createComment(input: {
  wagerId: number;
  userId: number;
  content: string;
}): Promise<{ id: number; createdAt: Date | null }> {
  const [row] = await db
    .insert(Comment)
    .values({
      wager_id: input.wagerId,
      user_id: input.userId,
      content: input.content,
    })
    .returning({
      id: Comment.id,
      createdAt: Comment.created_at,
    });

  return row;
}