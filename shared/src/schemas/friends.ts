import { z } from "zod";
import { userSummarySchema } from "./user";

export const friendshipStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export const friendRequestDirectionSchema = z.enum(["incoming", "outgoing"]);

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const friendsListQuerySchema = paginationQuerySchema;

export const friendRequestsListQuerySchema = paginationQuerySchema.extend({
  direction: friendRequestDirectionSchema.default("incoming"),
});

export const sendFriendRequestSchema = z.object({
  addresseeId: z.coerce.number().int().positive(),
});

export const friendSummarySchema = userSummarySchema;

export const friendRequestSummarySchema = z.object({
  id: z.number().int(),
  status: friendshipStatusSchema,
  createdAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  requester: userSummarySchema,
  addressee: userSummarySchema,
});

export const paginatedFriendsResponseSchema = z.object({
  data: z.array(friendSummarySchema),
  pagination: paginationMetaSchema,
});

export const paginatedFriendRequestsResponseSchema = z.object({
  data: z.array(friendRequestSummarySchema),
  pagination: paginationMetaSchema,
});

export const friendRequestResponseSchema = z.object({
  data: friendRequestSummarySchema,
});

export const friendActionResponseSchema = z.object({
  message: z.string(),
});

export const friendDiscoveryQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).default(""),
});

export const friendDiscoveryStateSchema = z.enum([
  "AVAILABLE",
  "FRIENDS",
  "OUTGOING_PENDING",
  "INCOMING_PENDING",
]);

export const discoveredUserSchema = userSummarySchema.extend({
  relationshipState: friendDiscoveryStateSchema,
  friendshipId: z.number().int().nullable(),
});

export const paginatedDiscoveredUsersResponseSchema = z.object({
  data: z.array(discoveredUserSchema),
  pagination: paginationMetaSchema,
});


export type FriendshipStatus = z.infer<typeof friendshipStatusSchema>;
export type FriendRequestDirection = z.infer<typeof friendRequestDirectionSchema>;
export type FriendsListQuery = z.infer<typeof friendsListQuerySchema>;
export type FriendRequestsListQuery = z.infer<typeof friendRequestsListQuerySchema>;
export type SendFriendRequestRequest = z.infer<typeof sendFriendRequestSchema>;
export type FriendSummary = z.infer<typeof friendSummarySchema>;
export type FriendRequestSummary = z.infer<typeof friendRequestSummarySchema>;
export type FriendDiscoveryQuery = z.infer<typeof friendDiscoveryQuerySchema>;
export type FriendDiscoveryState = z.infer<typeof friendDiscoveryStateSchema>;
export type DiscoveredUser = z.infer<typeof discoveredUserSchema>;