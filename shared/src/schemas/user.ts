import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "PLAYER", "USER"]);

export const createUserRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(4), 
  roleId: z.coerce.number().int().positive().optional(), 
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userSummarySchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string(),
  roleName: z.string().nullable(),
  isVerified: z.boolean().optional(),
  createdAt: z.string().nullable(),
  suspendedUntil: z.string().nullable().optional(),
});

export const userDetailSchema = userSummarySchema.extend({});

export const updateUserRoleRequestSchema = z.object({
  roleName: userRoleSchema,
});

export const suspendUserRequestSchema = z.object({
  durationValue: z.coerce.number().int().positive().max(24 * 365),
  durationUnit: z.enum(["hours", "days", "months"]),
});

export const userMutationResponseSchema = z.object({
  data: userSummarySchema,
});

export const userDeleteResponseSchema = z.object({
  message: z.string(),
});

// Response Wrappers
export const loginResponseSchema = z.object({
  message: z.string(),
});

export const listUsersResponseSchema = z.object({
  data: z.array(userSummarySchema),
});

export const getMeResponseSchema = z.object({
  data: userSummarySchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UserSummary = z.infer<typeof userSummarySchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;
export type SuspendUserRequest = z.infer<typeof suspendUserRequestSchema>;
