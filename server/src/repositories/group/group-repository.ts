import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "../../db/db";
import { Group, GroupMembership, Outcome, Transaction, User, Wager, Wallet } from "../../db/schema";

export type GroupPreviewMemberRow = {
  id: number;
  username: string;
  netPnl: string;
};

export type GroupRow = {
  id: number;
  name: string;
  description: string | null;
  inviteCode: string | null;
  currentUserRole: string;
  memberCount: number;
  activeWagerCount: number;
  netPnl: string;
  topMembers: GroupPreviewMemberRow[];
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

const AllGroupMembership = alias(GroupMembership, "all_group_membership");

async function getCurrentUserNetPnlByGroupId(userId: number, groupIds: number[]) {
  if (groupIds.length === 0) return new Map<number, string>();

  const rows = await db
    .select({
      groupId: Wager.group_id,
      netPnl: sum(Transaction.amount),
    })
    .from(Transaction)
    .innerJoin(Wallet, eq(Wallet.id, Transaction.wallet_id))
    .innerJoin(Outcome, eq(Outcome.id, Transaction.outcome_id))
    .innerJoin(Wager, eq(Wager.id, Outcome.wager_id))
    .where(and(eq(Wallet.user_id, userId), inArray(Wager.group_id, groupIds)))
    .groupBy(Wager.group_id);

  return new Map(
    rows
      .filter((row): row is { groupId: number; netPnl: string | null } => row.groupId !== null)
      .map((row) => [row.groupId, row.netPnl ?? "0"]),
  );
}

async function getTopMembersForGroup(groupId: number): Promise<GroupPreviewMemberRow[]> {
  const netPnl = sql<string>`
    COALESCE(
      SUM(${Transaction.amount}) FILTER (WHERE ${Wager.group_id} = ${groupId}),
      0
    )
  `;

  return db
    .select({
      id: User.id,
      username: User.username,
      netPnl,
    })
    .from(GroupMembership)
    .innerJoin(User, eq(User.id, GroupMembership.user_id))
    .leftJoin(Wallet, eq(Wallet.user_id, User.id))
    .leftJoin(Transaction, eq(Transaction.wallet_id, Wallet.id))
    .leftJoin(Outcome, eq(Outcome.id, Transaction.outcome_id))
    .leftJoin(Wager, eq(Wager.id, Outcome.wager_id))
    .where(eq(GroupMembership.group_id, groupId))
    .groupBy(User.id, User.username)
    .orderBy(desc(netPnl), User.username)
    .limit(3);
}

async function getTopMembersByGroupId(groupIds: number[]) {
  const rowsByGroup = await Promise.all(
    groupIds.map(async (groupId) => {
      const rows = await getTopMembersForGroup(groupId);
      return [groupId, rows] as const;
    }),
  );

  return new Map(rowsByGroup);
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

export async function countAllGroups(query: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${Group.id})`.mapWith(Number) })
    .from(Group)
    .where(groupSearchCondition(query));

  return row.count;
}

export async function listGroupsForUser(
  userId: number,
  query: string,
  limit: number,
  offset: number,
): Promise<GroupRow[]> {
  const groups = await db
    .select({
      ...groupSelect,
      currentUserRole: GroupMembership.role,
      memberCount: sql<number>`count(distinct ${AllGroupMembership.id})`.mapWith(Number),
      activeWagerCount: sql<number>`
        count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))
      `.mapWith(Number),
    })
    .from(Group)
    .innerJoin(GroupMembership, eq(GroupMembership.group_id, Group.id))
    .innerJoin(AllGroupMembership, eq(AllGroupMembership.group_id, Group.id))
    .leftJoin(Wager, eq(Wager.group_id, Group.id))
    .where(and(eq(GroupMembership.user_id, userId), groupSearchCondition(query)))
    .groupBy(Group.id, Group.name, Group.description, Group.invite_code, Group.created_at, GroupMembership.role)
    .orderBy(desc(Group.created_at), desc(Group.id))
    .limit(limit)
    .offset(offset);

  const groupIds = groups.map((group) => group.id);
  const [netPnlByGroupId, topMembersByGroupId] = await Promise.all([
    getCurrentUserNetPnlByGroupId(userId, groupIds),
    getTopMembersByGroupId(groupIds),
  ]);

  return groups.map((group) => ({
    ...group,
    netPnl: netPnlByGroupId.get(group.id) ?? "0",
    topMembers: topMembersByGroupId.get(group.id) ?? [],
  }));
}

export async function listAllGroups(
  query: string,
  limit: number,
  offset: number,
): Promise<GroupRow[]> {
  const groups = await db
    .select({
      ...groupSelect,
      currentUserRole: sql<string>`'OWNER'`,
      memberCount: sql<number>`count(distinct ${AllGroupMembership.id})`.mapWith(Number),
      activeWagerCount: sql<number>`
        count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))
      `.mapWith(Number),
    })
    .from(Group)
    .leftJoin(AllGroupMembership, eq(AllGroupMembership.group_id, Group.id))
    .leftJoin(Wager, eq(Wager.group_id, Group.id))
    .where(groupSearchCondition(query))
    .groupBy(Group.id, Group.name, Group.description, Group.invite_code, Group.created_at)
    .orderBy(desc(Group.created_at), desc(Group.id))
    .limit(limit)
    .offset(offset);

  const groupIds = groups.map((group) => group.id);
  const topMembersByGroupId = await getTopMembersByGroupId(groupIds);

  return groups.map((group) => ({
    ...group,
    netPnl: "0",
    topMembers: topMembersByGroupId.get(group.id) ?? [],
  }));
}

export async function findGroupForUser(groupId: number, userId: number): Promise<GroupRow | null> {
  const rows = await db
    .select({
      ...groupSelect,
      currentUserRole: GroupMembership.role,
      memberCount: sql<number>`count(distinct ${AllGroupMembership.id})`.mapWith(Number),
      activeWagerCount: sql<number>`
        count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))
      `.mapWith(Number),
    })
    .from(Group)
    .innerJoin(GroupMembership, eq(GroupMembership.group_id, Group.id))
    .innerJoin(AllGroupMembership, eq(AllGroupMembership.group_id, Group.id))
    .leftJoin(Wager, eq(Wager.group_id, Group.id))
    .where(and(eq(Group.id, groupId), eq(GroupMembership.user_id, userId)))
    .groupBy(Group.id, Group.name, Group.description, Group.invite_code, Group.created_at, GroupMembership.role)
    .limit(1);

  const group = rows[0];
  if (!group) return null;

  const [netPnlByGroupId, topMembersByGroupId] = await Promise.all([
    getCurrentUserNetPnlByGroupId(userId, [group.id]),
    getTopMembersByGroupId([group.id]),
  ]);

  return {
    ...group,
    netPnl: netPnlByGroupId.get(group.id) ?? "0",
    topMembers: topMembersByGroupId.get(group.id) ?? [],
  };
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

export async function countActiveWagersForGroup(groupId: number): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(distinct ${Wager.id}) filter (where ${Wager.status} in ('OPEN', 'PENDING'))`.mapWith(Number),
    })
    .from(Wager)
    .where(eq(Wager.group_id, groupId));

  return row.count;
}
