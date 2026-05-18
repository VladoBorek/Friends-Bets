import { Elysia } from "elysia";
import { z } from "zod";
import {
  addGroupMemberRequestSchema,
  createGroupRequestSchema,
  groupActionResponseSchema,
  groupMemberResponseSchema,
  groupMembersListQuerySchema,
  groupResponseSchema,
  groupsListQuerySchema,
  joinGroupByInviteRequestSchema,
  paginatedGroupMembersResponseSchema,
  paginatedGroupsResponseSchema,
  updateGroupRequestSchema,
  groupInvitationResponseSchema,
  groupInvitationsListQuerySchema,
  paginatedGroupInvitationsResponseSchema,
  sendGroupInvitationRequestSchema,
} from "@pb138/shared/schemas/groups";
import { authPlugin, getAuthenticatedUser } from "../plugins/auth";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  joinGroupByInvite,
  leaveGroup,
  listGroupMembers,
  listGroups,
  removeGroupMember,
  updateGroup,
  acceptGroupInvitation,
  listGroupInvitations,
  rejectGroupInvitation,
  sendGroupInvitation,
} from "../services/groups";

const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

const groupMemberParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

const invitationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});



// All group routes require an authenticated user.
// Services decide whether the user is just a member or must be an owner.

export const groupRoutes = new Elysia({ prefix: "/groups" })
  .use(authPlugin)

  // Lists only groups where the current user is a member.
  .get("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const query = groupsListQuerySchema.parse(context.query);
    const result = await listGroups(actor.id, query);

    return paginatedGroupsResponseSchema.parse(result);
  })

  // Creates a new group and automatically makes the current user its owner.
  .post("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const body = createGroupRequestSchema.parse(context.body);
    const data = await createGroup(actor.id, body);

    return groupResponseSchema.parse({ data });
  })

  // Joins an existing group by invite code.
  .post("/join", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const body = joinGroupByInviteRequestSchema.parse(context.body);
    const data = await joinGroupByInvite(actor.id, body);

    return groupResponseSchema.parse({ data });
  })

  .get("/invitations", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const query = groupInvitationsListQuerySchema.parse(context.query);
    const result = await listGroupInvitations(actor.id, query);

    return paginatedGroupInvitationsResponseSchema.parse(result);
  })

  .post("/invitations/:id/accept", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = invitationIdParamsSchema.parse(context.params);
    const data = await acceptGroupInvitation(actor.id, params.id);

    return groupInvitationResponseSchema.parse({ data });
  })

  .post("/invitations/:id/reject", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = invitationIdParamsSchema.parse(context.params);
    const data = await rejectGroupInvitation(actor.id, params.id);

    return groupInvitationResponseSchema.parse({ data });
  })

  .post("/:groupId/invitations", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = sendGroupInvitationRequestSchema.parse(context.body);
    const data = await sendGroupInvitation(actor.id, params.groupId, body);

    return groupInvitationResponseSchema.parse({ data });
  })

  // Returns group details, but only if the current user belongs to it.
  .get("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const data = await getGroup(actor.id, params.groupId);

    return groupResponseSchema.parse({ data });
  })

  // Updates group metadata. The service enforces owner/admin-only access.
  .patch("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = updateGroupRequestSchema.parse(context.body);
    const data = await updateGroup(actor, params.groupId, body);

    return groupResponseSchema.parse({ data });
  })

  // Deletes the whole group. The service prevents non-owners from doing this.
  .delete("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await deleteGroup(actor.id, params.groupId);

    return groupActionResponseSchema.parse({ message: "Group deleted successfully" });
  })

  // Allows the current user to leave the group.
  // The service prevents the last owner from leaving.
  .post("/:groupId/leave", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await leaveGroup(actor.id, params.groupId);

    return groupActionResponseSchema.parse({ message: "Left group successfully" });
  })

  // Lists group members with pagination.
  // Only existing members can view the member list.
  .get("/:groupId/members", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const query = groupMembersListQuerySchema.parse(context.query);
    const result = await listGroupMembers(actor.id, params.groupId, query);

    return paginatedGroupMembersResponseSchema.parse(result);
  })

  // Adds a user to the group. The service enforces owner-only access.
  .post("/:groupId/members", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = addGroupMemberRequestSchema.parse(context.body);
    const data = await addGroupMember(actor.id, params.groupId, body);

    return groupMemberResponseSchema.parse({ data });
  })

  // Removes a user from the group.
  // The service prevents removing the last owner.
  .delete("/:groupId/members/:userId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupMemberParamsSchema.parse(context.params);

    await removeGroupMember(actor.id, params.groupId, params.userId);

    return groupActionResponseSchema.parse({ message: "Group member removed successfully" });
  });
