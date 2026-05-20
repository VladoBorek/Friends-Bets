import { z } from "zod";

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const messageDataSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
});

export const apiErrorCodes = [
  "BAD_REQUEST",
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "ENDPOINT_NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_SERVER_ERROR",

  "AUTH_REQUIRED",
  "AUTH_INVALID_SESSION",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_FORBIDDEN",

  "USER_NOT_FOUND",
  "EMAIL_ALREADY_IN_USE",
  "EMAIL_DELIVERY_DISABLED",
  "EMAIL_SEND_FAILED",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",

  "WALLET_NOT_FOUND",
  "WALLET_INSUFFICIENT_BALANCE",
  "WALLET_TRANSACTION_FAILED",

  "WAGER_NOT_FOUND",
  "WAGER_FORBIDDEN",
  "WAGER_NOT_OPEN",
  "WAGER_ALREADY_CLOSED",
  "OUTCOME_NOT_FOUND",
  "BET_ALREADY_EXISTS",

  "GROUP_NOT_FOUND",
  "GROUP_INVITATION_NOT_FOUND",
  "GROUP_INVITATION_FORBIDDEN",

  "FRIEND_NOT_FOUND",
  "FRIEND_REQUEST_NOT_FOUND",
  "FRIEND_REQUEST_ALREADY_EXISTS",
  "FRIENDSHIP_ALREADY_EXISTS",

  "CATEGORY_NOT_FOUND",
  "CATEGORY_ALREADY_EXISTS",
  "CATEGORY_IN_USE",
] as const;

export const apiErrorCodeSchema = z.enum(apiErrorCodes);

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().min(1),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type MessageDataResponse = z.infer<typeof messageDataSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;