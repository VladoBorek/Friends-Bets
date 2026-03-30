import { z } from "zod";

export const wagerStatusSchema = z.enum(["OPEN", "PENDING", "CLOSED"]);

export const createWagerOutcomeSchema = z.object({
  title: z.string().min(1).max(120),
  odds: z.coerce.number().positive().max(100).optional(),
});

export const createWagerRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2_000).optional(),
  categoryId: z.coerce.number().int().positive(),
  createdById: z.coerce.number().int().positive(),
  isPublic: z.boolean().default(true),
  outcomes: z.array(createWagerOutcomeSchema).min(2).max(8),
});

export const wagerSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: wagerStatusSchema,
  categoryId: z.number().int(),
  categoryName: z.string(),
  createdById: z.number().int(),
  creatorName: z.string(),
  isPublic: z.boolean(),
  createdAt: z.string().nullable(),
});

export const wagerDetailOutcomeSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  odds: z.string().nullable(),
  isWinner: z.boolean().nullable(),
});

export const wagerDetailSchema = wagerSummarySchema.extend({
  outcomes: z.array(wagerDetailOutcomeSchema),
});

export const listWagersResponseSchema = z.object({
  data: z.array(wagerSummarySchema),
});

export const getWagerResponseSchema = z.object({
  data: wagerDetailSchema,
});

export const createWagerResponseSchema = z.object({
  data: wagerDetailSchema,
});

export const placeBetRequestSchema = z.object({
  userId: z.coerce.number().int().positive(),
  outcomeId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
});

export const betSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  outcomeId: z.number().int(),
  amount: z.number(),
  createdAt: z.string(),
});

export const placeBetResponseSchema = z.object({
  data: betSchema,
});

export type CreateWagerRequest = z.infer<typeof createWagerRequestSchema>;
export type WagerSummary = z.infer<typeof wagerSummarySchema>;
export type WagerDetail = z.infer<typeof wagerDetailSchema>;
export type PlaceBetRequest = z.infer<typeof placeBetRequestSchema>;
export type Bet = z.infer<typeof betSchema>;
