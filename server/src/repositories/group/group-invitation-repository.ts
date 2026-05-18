import { and, desc, eq, sql } from "drizzle-orm";
import type { GroupInvitationDirection } from "@pb138/shared/schemas/groups";
import { db } from "../../db/db";
import { GroupInvitation } from "../../db/schema";

export type GroupInvitationRow = {
  id: number;
  groupId: number;
  requesterId: number;
  addresseeId: number;
  status: string;
  createdAt: Date | null;
  respondedAt: Date | null;
};

const invitationSelect = {
  id: GroupInvitation.id,
  groupId: GroupInvitation.group_id,
  requesterId: GroupInvitation.requester_id,
  addresseeId: GroupInvitation.addressee_id,
  status: GroupInvitation.status,
  createdAt: GroupInvitation.created_at,
  respondedAt: GroupInvitation.responded_at,
};

function directionCondition(currentUserId: number, direction: GroupInvitationDirection) {
  return direction === "incoming"
    ? eq(GroupInvitation.addressee_id, currentUserId)
    : eq(GroupInvitation.requester_id, currentUserId);
}

export async function findGroupInvitationById(id: number): Promise<GroupInvitationRow | null> {
  const [row] = await db.select(invitationSelect).from(GroupInvitation).where(eq(GroupInvitation.id, id)).limit(1);
  return row ?? null;
}

export async function findGroupInvitationForUser(groupId: number, addresseeId: number): Promise<GroupInvitationRow | null> {
  const [row] = await db
    .select(invitationSelect)
    .from(GroupInvitation)
    .where(and(eq(GroupInvitation.group_id, groupId), eq(GroupInvitation.addressee_id, addresseeId)))
    .limit(1);

  return row ?? null;
}

export async function createGroupInvitation(groupId: number, requesterId: number, addresseeId: number) {
  const [row] = await db
    .insert(GroupInvitation)
    .values({ group_id: groupId, requester_id: requesterId, addressee_id: addresseeId, status: "PENDING" })
    .returning(invitationSelect);

  return row;
}

export async function reopenGroupInvitation(id: number, requesterId: number) {
  const [row] = await db
    .update(GroupInvitation)
    .set({ requester_id: requesterId, status: "PENDING", responded_at: null, created_at: new Date() })
    .where(eq(GroupInvitation.id, id))
    .returning(invitationSelect);

  return row;
}

export async function updateGroupInvitationStatus(id: number, status: "ACCEPTED" | "REJECTED") {
  const [row] = await db
    .update(GroupInvitation)
    .set({ status, responded_at: new Date() })
    .where(eq(GroupInvitation.id, id))
    .returning(invitationSelect);

  return row;
}

export async function countPendingGroupInvitations(currentUserId: number, direction: GroupInvitationDirection) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(GroupInvitation)
    .where(and(eq(GroupInvitation.status, "PENDING"), directionCondition(currentUserId, direction)));

  return row.count;
}

export async function listPendingGroupInvitations(
  currentUserId: number,
  direction: GroupInvitationDirection,
  limit: number,
  offset: number,
) {
  return db
    .select(invitationSelect)
    .from(GroupInvitation)
    .where(and(eq(GroupInvitation.status, "PENDING"), directionCondition(currentUserId, direction)))
    .orderBy(desc(GroupInvitation.created_at))
    .limit(limit)
    .offset(offset);
}