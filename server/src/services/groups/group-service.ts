import crypto from "node:crypto";
import type {
  CreateGroupRequest,
  GroupsListQuery,
  JoinGroupByInviteRequest,
  UpdateGroupRequest,
} from "@pb138/shared/schemas/groups";
import { HttpError } from "../../errors";
import * as groupMemberRepository from "../../repositories/group/group-member-repository";
import * as groupRepository from "../../repositories/group/group-repository";
import { mapGroupSummary } from "./mappers/group-mapper";
import { requireGroupOwner, requireGroupOwnerOrAdmin } from "./group-permission-service";

function buildInviteCode(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export async function listGroups(currentUserId: number, query: GroupsListQuery) {
  const [total, rows] = await Promise.all([
    groupRepository.countGroupsForUser(currentUserId, query.q),
    groupRepository.listGroupsForUser(currentUserId, query.q, query.limit, query.offset),
  ]);

  const data = rows.map(mapGroupSummary);

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}

export async function getGroup(currentUserId: number, groupId: number) {
  const group = await groupRepository.findGroupForUser(groupId, currentUserId);

  if (!group) {
    throw new HttpError(404, "NOT_FOUND", "Group not found");
  }

  return mapGroupSummary(group);
}

export async function createGroup(currentUserId: number, input: CreateGroupRequest) {
  const group = await groupRepository.createGroup({
    name: input.name,
    description: input.description ?? null,
    inviteCode: buildInviteCode(),
  });

  await groupMemberRepository.addGroupMember(group.id, currentUserId, "OWNER");

  const uniqueMemberIds = [...new Set(input.memberIds)].filter(
    (userId) => userId !== currentUserId,
  );

  await Promise.all(
    uniqueMemberIds.map((userId) =>
      groupMemberRepository.addGroupMember(group.id, userId, "MEMBER"),
    ),
  );

  const createdGroup = await groupRepository.findGroupForUser(group.id, currentUserId);

  if (!createdGroup) {
    throw new HttpError(404, "NOT_FOUND", "Group not found");
  }

  return mapGroupSummary(createdGroup);
}

export async function updateGroup(
  currentUser: { id: number; roleName: string | null },
  groupId: number,
  input: UpdateGroupRequest,
) {
  await requireGroupOwnerOrAdmin(groupId, currentUser);

  const updated = await groupRepository.updateGroup(groupId, {
    name: input.name,
    description: input.description,
  });

  if (!updated) {
    throw new HttpError(404, "NOT_FOUND", "Group not found");
  }

  const group = await groupRepository.findGroupForUser(groupId, currentUser.id);

  if (!group) {
    throw new HttpError(404, "NOT_FOUND", "Group not found");
  }

  return mapGroupSummary(group);
}

export async function deleteGroup(currentUserId: number, groupId: number): Promise<void> {
  await requireGroupOwner(groupId, currentUserId);
  await groupRepository.deleteGroup(groupId);
}

export async function joinGroupByInvite(
  currentUserId: number,
  input: JoinGroupByInviteRequest,
) {
  const group = await groupRepository.findGroupByInviteCode(input.inviteCode);

  if (!group) {
    throw new HttpError(404, "NOT_FOUND", "Invite code not found");
  }

  const existingMembership = await groupMemberRepository.findMembership(group.id, currentUserId);

  if (existingMembership) {
    throw new HttpError(400, "BAD_REQUEST", "You are already a member of this group");
  }

  await groupMemberRepository.addGroupMember(group.id, currentUserId, "MEMBER");

  const joinedGroup = await groupRepository.findGroupForUser(group.id, currentUserId);

  if (!joinedGroup) {
    throw new HttpError(404, "NOT_FOUND", "Group not found");
  }

  return mapGroupSummary(joinedGroup);
}