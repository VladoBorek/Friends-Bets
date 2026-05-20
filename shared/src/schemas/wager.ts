import { z } from "zod";
import { messageDataSchema, paginationMetaSchema, paginationQuerySchema } from "./api";

export const wagerStatusSchema = z.enum(["OPEN", "PENDING", "CLOSED"]);

export const wagersListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(200).default(""),
  status: z.enum(["ALL", "OPEN", "PENDING", "CLOSED"]).default("ALL"),
  category: z.string().default("ALL"),
  involvement: z.enum(["ALL", "MINE", "MY_BETS"]).default("ALL"),
});

export const categoriesListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).default(""),
});

export const wagerInvitationsListQuerySchema = paginationQuerySchema;
export const wagerBetsListQuerySchema = paginationQuerySchema;
export const wagerCommentsListQuerySchema = paginationQuerySchema;

export const createWagerOutcomeSchema = z.object({
  title: z.string().min(1).max(120),
});

export const createWagerRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2_000).optional(),
  categoryId: z.coerce.number().int().positive(),
  isPublic: z.boolean().default(true),
  outcomes: z.array(createWagerOutcomeSchema).min(2).max(8),
  invitedUserIds: z.array(z.number().int().positive()).optional(),
}).superRefine((data, ctx) => {
  if (!data.isPublic && (!data.invitedUserIds || data.invitedUserIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Private wagers must have at least one invited user.",
      path: ["invitedUserIds"],
    });
  }
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

export const paginatedWagersResponseSchema = z.object({
  data: z.array(wagerSummarySchema),
  pagination: paginationMetaSchema,
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

export const categoryAdminSummarySchema = categorySummarySchema.extend({
  wagerCount: z.number().int().nonnegative(),
  betCount: z.number().int().nonnegative(),
});

export const paginatedCategoriesResponseSchema = z.object({
  data: z.array(categorySummarySchema),
  pagination: paginationMetaSchema,
});

export const paginatedAdminCategoriesResponseSchema = z.object({
  data: z.array(categoryAdminSummarySchema),
  pagination: paginationMetaSchema,
});

export const wagerInvitationSummarySchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string().email(),
});

export const paginatedWagerInvitationsResponseSchema = z.object({
  data: z.array(wagerInvitationSummarySchema),
  pagination: paginationMetaSchema,
});

export const MIN_CREDIT_AMOUNT = 0.01;
export const BET_AMOUNT_ERROR_MESSAGE = `Bet amount must be at least ${MIN_CREDIT_AMOUNT.toFixed(2)}.`;

export const betAmountSchema = z.coerce
  .number()
  .refine((value) => Number.isFinite(value) && value >= MIN_CREDIT_AMOUNT, {
    message: BET_AMOUNT_ERROR_MESSAGE,
  })
  .refine((value) => Number.isInteger(value * 100), {
    message: BET_AMOUNT_ERROR_MESSAGE,
  });

export const placeBetRequestSchema = z.object({
  outcomeId: z.coerce.number().int().positive(),
  amount: betAmountSchema,
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

export const wagerBetSummarySchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  username: z.string(),
  outcomeTitle: z.string(),
  amount: z.string(),
});

export const paginatedWagerBetsResponseSchema = z.object({
  data: z.array(wagerBetSummarySchema),
  pagination: paginationMetaSchema,
});

export const wagerCommentSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  username: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const paginatedWagerCommentsResponseSchema = z.object({
  data: z.array(wagerCommentSchema),
  pagination: paginationMetaSchema,
});

export const placeBetResponseSchema = z.object({
  data: betSchema,
});

export const resolveWagerResponseSchema = z.object({
  data: wagerDetailSchema,
});

export const wagerActionResponseSchema = messageDataSchema;

export type CreateWagerRequest = z.infer<typeof createWagerRequestSchema>;
export type WagerSummary = z.infer<typeof wagerSummarySchema>;
export type WagerDetail = z.infer<typeof wagerDetailSchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type CategoryAdminSummary = z.infer<typeof categoryAdminSummarySchema>;
export type PlaceBetRequest = z.infer<typeof placeBetRequestSchema>;
export type Bet = z.infer<typeof betSchema>;
export type ResolveWagerRequest = z.infer<typeof resolveWagerRequestSchema>;
export type WagersListQuery = z.infer<typeof wagersListQuerySchema>;
export type CategoriesListQuery = z.infer<typeof categoriesListQuerySchema>;
export type WagerInvitationsListQuery = z.infer<typeof wagerInvitationsListQuerySchema>;
export type WagerBetsListQuery = z.infer<typeof wagerBetsListQuerySchema>;
export type WagerCommentsListQuery = z.infer<typeof wagerCommentsListQuerySchema>;
export type PaginatedWagersResponse = z.infer<typeof paginatedWagersResponseSchema>;