import type {
  FriendRequestSummary,
  SendFriendRequestRequest,
} from "@pb138/shared/schemas/friends";
import { HttpError } from "../../errors";
import type { FriendshipRow } from "../../repositories/friends/friend-repository";
import {
  createFriendRequest,
  findFriendshipBetweenUsers,
  findFriendshipById,
  findUserById,
  listUsersByIds,
  reopenRejectedFriendRequest,
  updateFriendshipStatus,
} from "../../repositories/friends/friend-repository";
import { buildUserSummaryMap, mapFriendRequestSummary } from "./mappers/friend-mapper";

async function toFriendRequestSummary(row: FriendshipRow): Promise<FriendRequestSummary> {
  const users = await listUsersByIds([row.requesterId, row.addresseeId]);
  const usersById = buildUserSummaryMap(users);

  return mapFriendRequestSummary(row, usersById);
}

export async function sendFriendRequest(
  currentUserId: number,
  input: SendFriendRequestRequest,
) {
  if (currentUserId === input.addresseeId) {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "You cannot send a friend request to yourself",
    });
  }

  const targetUser = await findUserById(input.addresseeId);

  if (!targetUser) {
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "Target user not found",
    });
  }

  const existing = await findFriendshipBetweenUsers(currentUserId, input.addresseeId);

  if (existing?.status === "ACCEPTED") {
    throw new HttpError({
      status: 409,
      code: "FRIENDSHIP_ALREADY_EXISTS",
      message: "You are already friends",
    });
  }

  if (existing?.status === "PENDING") {
    throw new HttpError({
      status: 409,
      code: "FRIEND_REQUEST_ALREADY_EXISTS",
      message: "Friend request already exists",
    });
  }

  if (existing?.status === "REJECTED") {
    const reopened = await reopenRejectedFriendRequest(
      existing.id,
      currentUserId,
      input.addresseeId,
    );

    return toFriendRequestSummary(reopened);
  }

  const created = await createFriendRequest(currentUserId, input.addresseeId);

  return toFriendRequestSummary(created);
}

export async function acceptFriendRequest(currentUserId: number, friendshipId: number) {
  const existing = await findFriendshipById(friendshipId);

  if (!existing) {
    throw new HttpError({
      status: 404,
      code: "FRIEND_REQUEST_NOT_FOUND",
      message: "Friend request not found",
    });
  }

  if (existing.addresseeId !== currentUserId) {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: "You can only accept requests sent to you",
    });
  }

  if (existing.status !== "PENDING") {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Only pending requests can be accepted",
    });
  }

  const updated = await updateFriendshipStatus(friendshipId, "ACCEPTED");

  return toFriendRequestSummary(updated);
}

export async function rejectFriendRequest(currentUserId: number, friendshipId: number) {
  const existing = await findFriendshipById(friendshipId);

  if (!existing) {
    throw new HttpError({
      status: 404,
      code: "FRIEND_REQUEST_NOT_FOUND",
      message: "Friend request not found",
    });
  }

  if (existing.addresseeId !== currentUserId) {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: "You can only reject requests sent to you",
    });
  }

  if (existing.status !== "PENDING") {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Only pending requests can be rejected",
    });
  }

  const updated = await updateFriendshipStatus(friendshipId, "REJECTED");

  return toFriendRequestSummary(updated);
}