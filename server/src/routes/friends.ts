import { Elysia } from "elysia";
import { z } from "zod";
import {
  friendActionResponseSchema,
  friendRequestResponseSchema,
  friendRequestsListQuerySchema,
  friendsListQuerySchema,
  paginatedFriendRequestsResponseSchema,
  paginatedFriendsResponseSchema,
  sendFriendRequestSchema,
} from "@pb138/shared/schemas/friends";
import { authPlugin, getAuthenticatedUser } from "../plugins/auth";
import { listFriends, listFriendRequests } from "../services/friends/friend-query-service";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/friends/friend-request-service";
import { removeFriend } from "../services/friends/friend-relationship-service";

const requestIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const friendRoutes = new Elysia({ prefix: "/friends" })
  .use(authPlugin)
  .get("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedQuery = friendsListQuerySchema.parse(context.query);
    const result = await listFriends(actor.id, parsedQuery);

    return paginatedFriendsResponseSchema.parse(result);
  })
  .get("/requests", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedQuery = friendRequestsListQuerySchema.parse(context.query);
    const result = await listFriendRequests(actor.id, parsedQuery);

    return paginatedFriendRequestsResponseSchema.parse(result);
  })
  .post("/requests", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedBody = sendFriendRequestSchema.parse(context.body);
    const data = await sendFriendRequest(actor.id, parsedBody);

    return friendRequestResponseSchema.parse({ data });
  })
  .post("/requests/:id/accept", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = requestIdParamsSchema.parse(context.params);
    const data = await acceptFriendRequest(actor.id, parsedParams.id);

    return friendRequestResponseSchema.parse({ data });
  })
  .post("/requests/:id/reject", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = requestIdParamsSchema.parse(context.params);
    const data = await rejectFriendRequest(actor.id, parsedParams.id);

    return friendRequestResponseSchema.parse({ data });
  })
  .delete("/:userId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = userIdParamsSchema.parse(context.params);

    await removeFriend(actor.id, parsedParams.userId);

    return friendActionResponseSchema.parse({
      message: "Friend removed successfully",
    });
  });
