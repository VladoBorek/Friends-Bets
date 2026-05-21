import { Elysia } from "elysia";
import { z } from "zod";
import {
  changeGroupOwnerRequestSchema,
  groupMembersListQuerySchema,
  groupsListQuerySchema,
  paginatedGroupMembersResponseSchema,
  paginatedGroupsResponseSchema,
  removeGroupMemberRequestSchema,
} from "@pb138/shared/schemas/groups";
import { HttpError } from "../errors";
import { authPlugin, getAuthenticatedUser, type AuthContextLike } from "../plugins/auth";
import {
  changeGroupOwnerAdmin,
  deleteGroupAdmin,
  listAllGroups,
  listGroupMembersAdmin,
  removeGroupMemberAdmin,
} from "../services/groups";

const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

const groupMemberParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

async function ensureAdmin(context: AuthContextLike) {
  const user = await getAuthenticatedUser(context);

  if (user.roleName !== "ADMIN") {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: "Admin privileges required",
    });
  }

  return user;
}

export const groupAdminRoutes = new Elysia({ prefix: "/admin/groups" })
  .use(authPlugin)
  .get("", async (context) => {
    await ensureAdmin(context);
    const query = groupsListQuerySchema.parse(context.query);
    const result = await listAllGroups(query.q, query.limit, query.offset);

    return paginatedGroupsResponseSchema.parse(result);
  })
  .get("/:groupId/members", async (context) => {
    await ensureAdmin(context);
    const params = groupIdParamsSchema.parse(context.params);
    const query = groupMembersListQuerySchema.parse(context.query);
    const result = await listGroupMembersAdmin(params.groupId, query.q, query.limit, query.offset);

    return paginatedGroupMembersResponseSchema.parse(result);
  })
  .delete("/:groupId/members/:userId", async (context) => {
    await ensureAdmin(context);
    const params = groupMemberParamsSchema.parse(context.params);
    const body = removeGroupMemberRequestSchema.optional().parse(context.body) ?? {};

    await removeGroupMemberAdmin(params.groupId, params.userId, body.newOwnerId);

    context.set.status = 204;
    return null;
  })
  .patch("/:groupId/owner", async (context) => {
    await ensureAdmin(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = changeGroupOwnerRequestSchema.parse(context.body);

    await changeGroupOwnerAdmin(params.groupId, body.newOwnerId);

    context.set.status = 204;
    return null;
  })
  .delete("/:groupId", async (context) => {
    await ensureAdmin(context);
    const params = groupIdParamsSchema.parse(context.params);

    await deleteGroupAdmin(params.groupId);

    context.set.status = 204;
    return null;
  });
