import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { FriendRequestDirection } from "@pb138/shared/schemas/friends";
import { db } from "../db/db";
import { Friendship, Role, User } from "../db/schema";

export type FriendUserRow = {
  id: number;
  username: string;
  email: string;
  roleName: string | null;
  isVerified: boolean | null;
  suspendedUntil: Date | null;
  createdAt: Date | null;
};

export type FriendshipRow = {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: string;
  createdAt: Date | null;
  respondedAt: Date | null;
};

const userSelect = {
   id: User.id,
    username: User.username,
    email: User.email,
    roleName: Role.name,
    isVerified: User.is_verified,
    suspendedUntil: User.suspended_until,
    createdAt: User.created_at,
}

const friendshipSelect  = {
  id: Friendship.id,
  requesterId: Friendship.requester_id,
  addresseeId: Friendship.addressee_id,
  status: Friendship.status,
  createdAt: Friendship.created_at,
  respondedAt: Friendship.responded_at,
};


export async function findUserById(userId: number) {
  const [row] = await db
    .select({ id: User.id })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  return row ?? null;
}

export async function listUsersByIds(userIds: number[]): Promise<FriendUserRow[]> {
  if (userIds.length === 0) return [];

  return db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(inArray(User.id, userIds));
}

export async function findFriendshipBetweenUsers(userA: number, userB: number): Promise<FriendshipRow | null> {
  const [row] = await db
    .select(friendshipSelect)
    .from(Friendship)
    .where(
      or(
        and(eq(Friendship.requester_id, userA), eq(Friendship.addressee_id, userB)),
        and(eq(Friendship.requester_id, userB), eq(Friendship.addressee_id, userA)),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findFriendshipById(friendshipId: number): Promise<FriendshipRow | null> {
  const [row] = await db
    .select(friendshipSelect)
    .from(Friendship)
    .where(eq(Friendship.id, friendshipId))
    .limit(1);

  return row ?? null;
}

export async function createFriendRequest(requesterId: number, addresseeId: number): Promise<FriendshipRow> {
  const [row] = await db
    .insert(Friendship)
    .values({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "PENDING",
    })
    .returning(friendshipSelect);

  return row;
}

export async function reopenRejectedFriendRequest(
  friendshipId: number,
  requesterId: number,
  addresseeId: number,
): Promise<FriendshipRow> {
  const [row] = await db
    .update(Friendship)
    .set({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "PENDING",
      responded_at: null,
    })
    .where(eq(Friendship.id, friendshipId))
    .returning(friendshipSelect);

  return row;
}

export async function updateFriendshipStatus(friendshipId: number, status: "ACCEPTED" | "REJECTED"): Promise<FriendshipRow> {
  const [row] = await db
    .update(Friendship)
    .set({
      status,
      responded_at: new Date(),
    })
    .where(eq(Friendship.id, friendshipId))
    .returning(friendshipSelect);

  return row;
}

export async function deleteFriendship(friendshipId: number): Promise<void> {
  await db.delete(Friendship).where(eq(Friendship.id, friendshipId));
}

export async function countAcceptedFriendsForUser(currentUserId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(Friendship)
    .where(
      and(
        eq(Friendship.status, "ACCEPTED"),
        or(
          eq(Friendship.requester_id, currentUserId),
          eq(Friendship.addressee_id, currentUserId),
        ),
      ),
    );

  return Number(row.count);
}

export async function listAcceptedFriendshipsForUser(currentUserId: number, limit: number, offset: number) {
  return db
    .select({
      requesterId: Friendship.requester_id,
      addresseeId: Friendship.addressee_id,
    })
    .from(Friendship)
    .where(
      and(
        eq(Friendship.status, "ACCEPTED"),
        or(
          eq(Friendship.requester_id, currentUserId),
          eq(Friendship.addressee_id, currentUserId),
        ),
      ),
    )
    .orderBy(desc(Friendship.responded_at), desc(Friendship.created_at))
    .limit(limit)
    .offset(offset);
}

function requestDirectionCondition(currentUserId: number, direction: FriendRequestDirection) {
  return direction === "incoming"
    ? eq(Friendship.addressee_id, currentUserId)
    : eq(Friendship.requester_id, currentUserId);
}

function buildUserSearchCondition(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  const pattern = `%${normalized}%`;

  return or(
    sql`lower(${User.username}) like ${pattern}`,
    sql`lower(${User.email}) like ${pattern}`,
  );
}

function buildDiscoverUsersWhere(currentUserId: number, query: string) {
  const searchCondition = buildUserSearchCondition(query);

  if (!searchCondition) {
    return ne(User.id, currentUserId);
  }

  return and(ne(User.id, currentUserId), searchCondition);
}


export async function countPendingFriendRequestsForUser(
  currentUserId: number,
  direction: FriendRequestDirection,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(Friendship)
    .where(and(eq(Friendship.status, "PENDING"), requestDirectionCondition(currentUserId, direction)));

  return Number(row.count);
}

export async function listPendingFriendRequestsForUser(
  currentUserId: number,
  direction: FriendRequestDirection,
  limit: number,
  offset: number,
): Promise<FriendshipRow[]> {
  return db
    .select(friendshipSelect )
    .from(Friendship)
    .where(and(eq(Friendship.status, "PENDING"), requestDirectionCondition(currentUserId, direction)))
    .orderBy(desc(Friendship.created_at))
    .limit(limit)
    .offset(offset);
}

export async function countDiscoverableUsers(currentUserId: number, query: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(User)
    .where(buildDiscoverUsersWhere(currentUserId, query));

  return Number(row.count);
}

export async function listDiscoverableUsers(
  currentUserId: number,
  query: string,
  limit: number,
  offset: number,
): Promise<FriendUserRow[]> {
  return db
    .select(userSelect)
    .from(User)
    .innerJoin(Role, eq(User.role_id, Role.id))
    .where(buildDiscoverUsersWhere(currentUserId, query))
    .orderBy(asc(User.username))
    .limit(limit)
    .offset(offset);
}

export async function listFriendshipsBetweenUserAndCandidates(
  currentUserId: number,
  candidateIds: number[],
): Promise<FriendshipRow[]> {
  if (candidateIds.length === 0) {
    return [];
  }

  return db
    .select(friendshipSelect)
    .from(Friendship)
    .where(
      or(
        and(
          eq(Friendship.requester_id, currentUserId),
          inArray(Friendship.addressee_id, candidateIds),
        ),
        and(
          eq(Friendship.addressee_id, currentUserId),
          inArray(Friendship.requester_id, candidateIds),
        ),
      ),
    );
}
