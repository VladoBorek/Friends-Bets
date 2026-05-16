import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { GroupRole } from "@pb138/shared/schemas/groups";
import { db } from "../../db/db";
import { GroupMembership, Role, User } from "../../db/schema";

export type GroupMembershipRow = {
  id: number;
  userId: number;
  groupId: number;
  role: string;
  joinedAt: Date | null;
};

export type GroupMemberRow = {
  membershipId: number;
  groupRole: string;
  joinedAt: Date | null;
  id: number;
  username: string;
  email: string;
  roleName: string | null;
  isVerified: boolean | null;
  suspendedUntil: Date | null;
  createdAt: Date | null;
};

const membershipSelect = {
  id: GroupMembership.id,
  userId: GroupMembership.user_id,
  groupId: GroupMembership.group_id,
  role: GroupMembership.role,
  joinedAt: GroupMembership.joined_at,
};

function memberSearchCondition(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  const pattern = `%${normalized}%`;

  return sql`lower(${User.username}) like ${pattern} or lower(${User.email}) like ${pattern}`;
}

export async function findMembership(
  groupId: number,
  userId: number,
): Promise<GroupMembershipRow | null> {
  const [row] = await db
    .select(membershipSelect)
    .from(GroupMembership)
    .where(and(eq(GroupMembership.group_id, groupId), eq(GroupMembership.user_id, userId)))
    .limit(1);

  return row ?? null;
}

export async function countGroupMembers(groupId: number, query: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(GroupMembership)
    .innerJoin(User, eq(User.id, GroupMembership.user_id))
    .where(and(eq(GroupMembership.group_id, groupId), memberSearchCondition(query)));

  return row.count;
}

export async function listGroupMembers(
  groupId: number,
  query: string,
  limit: number,
  offset: number,
): Promise<GroupMemberRow[]> {
  return db
    .select({
      membershipId: GroupMembership.id,
      groupRole: GroupMembership.role,
      joinedAt: GroupMembership.joined_at,
      id: User.id,
      username: User.username,
      email: User.email,
      roleName: Role.name,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
      createdAt: User.created_at,
    })
    .from(GroupMembership)
    .innerJoin(User, eq(User.id, GroupMembership.user_id))
    .innerJoin(Role, eq(Role.id, User.role_id))
    .where(and(eq(GroupMembership.group_id, groupId), memberSearchCondition(query)))
    .orderBy(asc(User.username), asc(User.id))
    .limit(limit)
    .offset(offset);
}

export async function addGroupMember(
  groupId: number,
  userId: number,
  role: GroupRole,
): Promise<GroupMembershipRow> {
  const [row] = await db
    .insert(GroupMembership)
    .values({
      group_id: groupId,
      user_id: userId,
      role,
    })
    .returning(membershipSelect);

  return row;
}

export async function updateGroupMemberRole(
  groupId: number,
  userId: number,
  role: GroupRole,
): Promise<GroupMembershipRow | null> {
  const [row] = await db
    .update(GroupMembership)
    .set({ role })
    .where(and(eq(GroupMembership.group_id, groupId), eq(GroupMembership.user_id, userId)))
    .returning(membershipSelect);

  return row ?? null;
}

export async function removeGroupMember(groupId: number, userId: number): Promise<void> {
  await db
    .delete(GroupMembership)
    .where(and(eq(GroupMembership.group_id, groupId), eq(GroupMembership.user_id, userId)));
}

export async function countOtherGroupOwners(groupId: number, userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(GroupMembership)
    .where(
      and(
        eq(GroupMembership.group_id, groupId),
        eq(GroupMembership.role, "OWNER"),
        ne(GroupMembership.user_id, userId),
      ),
    );

  return row.count;
}