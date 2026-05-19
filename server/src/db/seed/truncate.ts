import { db } from "../db";
import {
  Bet,
  Category,
  Comment,
  Friendship,
  Group,
  GroupMembership,
  Notification,
  Outcome,
  Role,
  Transaction,
  User,
  Wallet,
  Wager,
  WagerVisibility,
} from "../schema";

export async function truncateAll() {
  await db.delete(Bet);
  await db.delete(Transaction);
  await db.delete(Comment);
  await db.delete(Notification);
  await db.delete(WagerVisibility);
  await db.delete(Outcome);
  await db.delete(Wager);
  await db.delete(GroupMembership);
  await db.delete(Friendship);
  await db.delete(Wallet);
  await db.delete(Group);
  await db.delete(User);
  await db.delete(Category);
  await db.delete(Role);
}