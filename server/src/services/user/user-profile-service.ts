import type { UserSummary } from "@pb138/shared/schemas/user";
import bcrypt from "bcrypt";
import { HttpError } from "../../errors";
import { logger } from "../../observability";
import * as userRepository from "../../repositories/user/user-repository";
import { emailClient } from "../email-service";
import { getUserById } from "./user-query-service";

export async function updateNickname(userId: number, nickname: string): Promise<UserSummary> {
  await getUserById(userId);
  await userRepository.updateUsername(userId, nickname);

  return getUserById(userId);
}

export async function updateEmail(
  userId: number,
  newEmail: string,
  currentPassword: string,
): Promise<UserSummary> {
  const user = await userRepository.findUserWithPasswordById(userId);

  if (!user) {
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError({
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Current password is incorrect",
    });
  }

  const existingUser = await userRepository.findUserByEmail(newEmail);

  if (existingUser && existingUser.id !== userId) {
    throw new HttpError({
      status: 409,
      code: "EMAIL_ALREADY_IN_USE",
      message: "Email already in use",
    });
  }

  await userRepository.updateUserEmail(userId, newEmail);

  try {
    await emailClient.sendPrimaryEmailChangedEmail({
      email: newEmail,
      username: user.username,
      previousEmail: user.email,
      changedAtIso: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({
      event_name: "primary_email_change_notification_failed",
      user_id: userId,
      error,
    });
  }

  return getUserById(userId);
}

export async function updatePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
): Promise<UserSummary> {
  const user = await userRepository.findUserWithPasswordById(userId);

  if (!user) {
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError({
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Password is incorrect",
    });
  }

  if (oldPassword === newPassword) {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "New password must be different",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updateUserPassword(userId, passwordHash);

  return getUserById(userId);
}