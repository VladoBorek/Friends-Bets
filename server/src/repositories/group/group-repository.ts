import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { Group, GroupMembership, Wager } from "../../db/schema";

export type GroupRow = {
  id: number;
  name: string;
  description: string | null;
  inviteCode: string | null;
  currentUserRole: string;
  memberCount: number;
  activeWagerCount: number;
  createdAt: Date | null;
};

const groupSelect = {
  id: Group.id,
  name: Group.name,
  description: Group.description,
  inviteCode: Group.invite_code,
  createdAt: Group.created_at,
};

function groupSearchCondition(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  return sql`lower(${Group.name}) like ${`%${normalized}%`}`;
}

export async function findGroupById(groupId: number) {
  const [row] = await db
    .select(groupSelect)
    .from(Group)
    .where(eq(Group.id, groupId))
    .limit(1);

  return row ?? null;
}

export async function findGroupByInviteCode(inviteCode: string) {
  const [row] = await db
    .select(groupSelect)
    .from(Group)
    .where(eq(Group.invite_code, inviteCode))
    .limit(1);

  return row ?? null;
}

export async function countGroupsForUser(userId: number, query: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${Group.id})`.mapWith(Number) })
    .from(Group)
    .innerJoin(GroupMembership, eq(GroupMembership.group_id, Group.id))
    .where(and(eq(GroupMembership.user_id, userId), groupSearchCondition(query)));

  return row.count;
}

export async function listGroupsForUser(
  userId: number,
  query: string,
  limit: number,
  offset: number,
): Promise<GroupRow[]> {
  return db
    .select({
      ...groupSelect,
      currentUserRole: GroupMembership.role,
      memberCount: sql<number>`count(distinct ${GroupMembership.id})`.mapWith(Number),
      activeWagerCount: sql<number>`
        count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))
      `.mapWith(Number),
    })
    .from(Group)
    .innerJoin(GroupMembership, eq(GroupMembership.group_id, Group.id))
    .leftJoin(Wager, eq(Wager.group_id, Group.id))
    .where(and(eq(GroupMembership.user_id, userId), groupSearchCondition(query)))
    .groupBy(Group.id, Group.name, Group.description, Group.invite_code, Group.created_at, GroupMembership.role)
    .orderBy(desc(Group.created_at), desc(Group.id))
    .limit(limit)
    .offset(offset);
}

export async function findGroupForUser(groupId: number, userId: number): Promise<GroupRow | null> {
  const rows = await db
    .select({
      ...groupSelect,
      currentUserRole: GroupMembership.role,
      memberCount: sql<number>`count(distinct ${GroupMembership.id})`.mapWith(Number),
      activeWagerCount: sql<number>`
        count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))
      `.mapWith(Number),
    })
    .from(Group)
    .innerJoin(GroupMembership, eq(GroupMembership.group_id, Group.id))
    .leftJoin(Wager, eq(Wager.group_id, Group.id))
    .where(and(eq(Group.id, groupId), eq(GroupMembership.user_id, userId)))
    .groupBy(Group.id, Group.name, Group.description, Group.invite_code, Group.created_at, GroupMembership.role)
    .limit(1);

  return rows[0] ?? null;
}

export async function createGroup(input: {
  name: string;
  description: string | null;
  inviteCode: string;
}) {
  const [row] = await db
    .insert(Group)
    .values({
      name: input.name,
      description: input.description,
      invite_code: input.inviteCode,
    })
    .returning(groupSelect);

  return row;
}

export async function updateGroup(
  groupId: number,
  input: { name?: string; description?: string | null },
) {
  const [row] = await db
    .update(Group)
    .set(input)
    .where(eq(Group.id, groupId))
    .returning(groupSelect);

  return row ?? null;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await db.delete(Group).where(eq(Group.id, groupId));
}