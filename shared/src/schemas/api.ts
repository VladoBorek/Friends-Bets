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

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type MessageDataResponse = z.infer<typeof messageDataSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;