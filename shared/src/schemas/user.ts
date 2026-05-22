import { z } from "zod";
import { messageDataSchema, paginationMetaSchema, paginationQuerySchema } from "./api";

export const userRoleSchema = z.enum(["ADMIN", "PLAYER", "USER"]);

export const usersListQuerySchema = paginationQuerySchema;

export const userSearchQuerySchema = paginationQuerySchema.extend({
  email: z.string().min(1, "Email is required").max(200),
});

const strongPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const createUserRequestSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").max(50, "Username is too long"),
  email: z.string().email("Invalid email format"),
  password: strongPasswordSchema,
  roleId: z.coerce.number().int().positive().optional(),
});

export const loginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const resendVerificationByEmailRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const requestPasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: strongPasswordSchema,
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

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const updateNicknameRequestSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters long").max(50, "Nickname is too long"),
});

export const updateEmailRequestSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  currentPassword: z.string().min(1, "Current password is required"),
});

export const updatePasswordRequestSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: strongPasswordSchema,
});

export const userMutationResponseSchema = z.object({
  data: userSummarySchema,
});

export const userDeleteResponseSchema = messageDataSchema;

export const userActionResponseSchema = messageDataSchema;

export const verifyEmailResponseSchema = z.object({
  data: userSummarySchema,
});

export const resetPasswordByAdminResponseSchema = messageDataSchema;

export const loginResponseSchema = messageDataSchema;

export const listUsersResponseSchema = z.object({
  data: z.array(userSummarySchema),
  pagination: paginationMetaSchema,
});

export const searchUsersResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.number().int(),
      username: z.string(),
      email: z.string().email(),
    }),
  ),
  pagination: paginationMetaSchema,
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
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ResendVerificationByEmailRequest = z.infer<typeof resendVerificationByEmailRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type UpdateNicknameRequest = z.infer<typeof updateNicknameRequestSchema>;
export type UpdateEmailRequest = z.infer<typeof updateEmailRequestSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;
export type UsersListQuery = z.infer<typeof usersListQuerySchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
