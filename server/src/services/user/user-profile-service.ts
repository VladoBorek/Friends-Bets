import bcrypt from "bcrypt";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
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
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, "UNAUTHORIZED", "Current password is incorrect");
  }

  const existingUser = await userRepository.findUserByEmail(newEmail);

  if (existingUser && existingUser.id !== userId) {
    throw new HttpError(400, "BAD_REQUEST", "Email already in use");
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
    console.error("[Users] Primary email change notification failed", {
      userId,
      email: newEmail,
      error: error instanceof Error ? error.message : String(error),
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
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, "UNAUTHORIZED", "Password is incorrect");
  }

  if (oldPassword === newPassword) {
    throw new HttpError(400, "BAD_REQUEST", "New password must be different");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await userRepository.updateUserPassword(userId, passwordHash);

  return getUserById(userId);
}