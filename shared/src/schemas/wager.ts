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
  isPublic: z.boolean().default(true),
  outcomes: z.array(createWagerOutcomeSchema).min(2).max(8),
});

export const wagerOutcomeSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  odds: z.string().nullable(),
  totalBet: z.string(),
  isWinner: z.boolean(),
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
  totalPool: z.string(),
  currentUserBetAmount: z.string().nullable(),
  currentUserBetOutcomeTitle: z.string().nullable(),
  outcomes: z.array(wagerOutcomeSummarySchema),
});

export const wagerDetailOutcomeSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  odds: z.string().nullable(),
  totalBet: z.string(),
  isWinner: z.boolean(),
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

export const categorySummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const listCategoriesResponseSchema = z.object({
  data: z.array(categorySummarySchema),
});

export const BET_AMOUNT_ERROR_MESSAGE = "Bet amount must be at least 0.01.";

export const placeBetRequestSchema = z.object({
  outcomeId: z.coerce.number().int().positive(),
  amount: z.coerce
    .number()
    .refine((value) => Number.isFinite(value) && value >= 0.01, {
      message: BET_AMOUNT_ERROR_MESSAGE,
    })
    .refine((value) => Number.isInteger(value * 100), {
      message: BET_AMOUNT_ERROR_MESSAGE,
    }),
});

export const resolveWagerRequestSchema = z.object({
  outcomeId: z.coerce.number().int().positive(),
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

export const resolveWagerResponseSchema = z.object({
  data: wagerDetailSchema,
});

export type CreateWagerRequest = z.infer<typeof createWagerRequestSchema>;
export type WagerSummary = z.infer<typeof wagerSummarySchema>;
export type WagerDetail = z.infer<typeof wagerDetailSchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type PlaceBetRequest = z.infer<typeof placeBetRequestSchema>;
export type Bet = z.infer<typeof betSchema>;
export type ResolveWagerRequest = z.infer<typeof resolveWagerRequestSchema>;
