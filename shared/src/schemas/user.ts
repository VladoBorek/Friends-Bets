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
  createdAt: z.string().nullable(),
});

export const userDetailSchema = userSummarySchema.extend({});

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
