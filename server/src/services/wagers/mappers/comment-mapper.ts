import type { CommentRow } from "../../../repositories/wagers/comment-repository";

export type WagerComment = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
};

export function mapWagerComment(row: CommentRow): WagerComment {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    content: row.content,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
  };
}
