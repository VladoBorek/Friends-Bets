import type {
  GroupInvitationsListQuery,
  GroupInvitationSummary,
  SendGroupInvitationRequest,
} from "@pb138/shared/schemas/groups";
import { HttpError } from "../../errors";
import * as groupRepository from "../../repositories/group/group-repository";
import * as groupMemberRepository from "../../repositories/group/group-member-repository";
import * as groupInvitationRepository from "../../repositories/group/group-invitation-repository";
import * as userRepository from "../../repositories/user-repository";
import { mapUserSummary } from "../user/mappers/user-mapper";
import { mapGroupMemberSummary } from "./mappers/group-mapper";
import { requireGroupMember } from "./group-permission-service";

async function toSummary(row: groupInvitationRepository.GroupInvitationRow): Promise<GroupInvitationSummary> {
  const [group, requester, addressee, memberCount, activeWagerCount, members] = await Promise.all([
    groupRepository.findGroupById(row.groupId),
    userRepository.findUserById(row.requesterId),
    userRepository.findUserById(row.addresseeId),
    groupMemberRepository.countGroupMembers(row.groupId, ""),
    groupRepository.countActiveWagersForGroup(row.groupId),
    groupMemberRepository.listGroupMembers(row.groupId, "", 5, 0),
  ]);

  if (!group || !requester || !addressee) {
    throw new HttpError(500, "Group invitation references missing data");
  }

  return {
    id: row.id,
    status: row.status as "PENDING" | "ACCEPTED" | "REJECTED",
    createdAt: row.createdAt?.toISOString() ?? null,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt?.toISOString() ?? null,
      memberCount,
      activeWagerCount,
      members: members.map(mapGroupMemberSummary),
    },
    requester: mapUserSummary(requester),
    addressee: mapUserSummary(addressee),
  };
}

export async function listGroupInvitations(currentUserId: number, query: GroupInvitationsListQuery) {
  const [total, rows] = await Promise.all([
    groupInvitationRepository.countPendingGroupInvitations(currentUserId, query.direction),
    groupInvitationRepository.listPendingGroupInvitations(currentUserId, query.direction, query.limit, query.offset),
  ]);

  const data = await Promise.all(rows.map(toSummary));

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

export async function sendGroupInvitation(currentUserId: number, groupId: number, input: SendGroupInvitationRequest) {
  if (currentUserId === input.addresseeId) {
    throw new HttpError(400, "You cannot invite yourself");
  }

  await requireGroupMember(groupId, currentUserId);

  const user = await userRepository.findUserById(input.addresseeId);
  if (!user) throw new HttpError(404, "User not found");

  const existingMembership = await groupMemberRepository.findMembership(groupId, input.addresseeId);
  if (existingMembership) throw new HttpError(400, "User is already a member of this group");

  const existingInvite = await groupInvitationRepository.findGroupInvitationForUser(groupId, input.addresseeId);

  if (existingInvite?.status === "PENDING") {
    throw new HttpError(400, "Group invitation already exists");
  }

  const row =
    existingInvite?.status === "REJECTED"
      ? await groupInvitationRepository.reopenGroupInvitation(existingInvite.id, currentUserId)
      : await groupInvitationRepository.createGroupInvitation(groupId, currentUserId, input.addresseeId);

  return toSummary(row);
}

export async function acceptGroupInvitation(currentUserId: number, invitationId: number) {
  const invite = await groupInvitationRepository.findGroupInvitationById(invitationId);

  if (!invite) throw new HttpError(404, "Group invitation not found");
  if (invite.addresseeId !== currentUserId) throw new HttpError(403, "You can only accept invitations sent to you");
  if (invite.status !== "PENDING") throw new HttpError(400, "Only pending invitations can be accepted");

  const existingMembership = await groupMemberRepository.findMembership(invite.groupId, currentUserId);
  if (!existingMembership) {
    await groupMemberRepository.addGroupMember(invite.groupId, currentUserId, "MEMBER");
  }

  const updated = await groupInvitationRepository.updateGroupInvitationStatus(invitationId, "ACCEPTED");
  return toSummary(updated);
}

export async function rejectGroupInvitation(currentUserId: number, invitationId: number) {
  const invite = await groupInvitationRepository.findGroupInvitationById(invitationId);

  if (!invite) throw new HttpError(404, "Group invitation not found");
  if (invite.addresseeId !== currentUserId) throw new HttpError(403, "You can only reject invitations sent to you");
  if (invite.status !== "PENDING") throw new HttpError(400, "Only pending invitations can be rejected");

  const updated = await groupInvitationRepository.updateGroupInvitationStatus(invitationId, "REJECTED");
  return toSummary(updated);
}