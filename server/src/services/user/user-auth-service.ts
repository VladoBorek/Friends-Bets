import bcrypt from "bcrypt";
import type { CreateUserRequest, LoginRequest, UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
import { emailClient } from "../email-service";
import { readServerConfig } from "../../config";
import { mapUserSummary } from "./mappers/user-mapper";
import {
  buildVerificationToken,
  buildVerificationUrl,
  verifyCryptoToken,
  buildPasswordResetToken,
  buildPasswordResetUrl,
} from "./user-token-service";
import * as userRepository from "../../repositories/user/user-repository";
import { getUserById, getUserByEmail } from "./user-query-service";

export async function createUser(input: CreateUserRequest): Promise<UserSummary> {
  const existingUser = await userRepository.findUserByEmail(input.email);

  if (existingUser) {
    throw new HttpError(400, "BAD_REQUEST", "Email already in use");
  }

  const roleId = input.roleId ?? await userRepository.findRoleIdByName("USER");

  if (!roleId) {
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Default role not configured");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const newUserId = await userRepository.createUserWithWallet(input, passwordHash, roleId);

  const createdUser = await getUserById(newUserId);
  const { token } = buildVerificationToken(createdUser.id);
  const verificationUrl = buildVerificationUrl(token);

  try {
    await emailClient.sendRegistrationEmail({
      email: createdUser.email,
      username: createdUser.username,
      activationUrl: verificationUrl,
    });
  } catch (error) {
    console.error("[Users] Registration verification email failed", {
      userId: createdUser.id,
      email: createdUser.email,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return createdUser;
}

export async function getUserByCredentials(input: LoginRequest): Promise<UserSummary> {
  const user = await userRepository.findUserWithPasswordByEmail(input.email);

  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValid) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid email or password");
  }

  return mapUserSummary(user);
}

export async function verifyEmailToken(token: string): Promise<UserSummary> {
  const secret = readServerConfig().secrets.emailVerification;
  const userId = verifyCryptoToken(token, secret);

  await userRepository.updateUserVerification(userId, true);

  return getUserById(userId);
}

export async function resendVerificationEmail(userId: number): Promise<void> {
  const emailConfig = readServerConfig().email;

  if (!emailConfig.enabled) {
    throw new HttpError(400, "BAD_REQUEST", "Email delivery is disabled.");
  }

  const user = await getUserById(userId);

  if (user.isVerified) {
    throw new HttpError(400, "BAD_REQUEST", "User is already verified");
  }

  const { token } = buildVerificationToken(user.id);
  const verificationUrl = buildVerificationUrl(token);

  await emailClient.sendVerificationReminderEmail({
    email: user.email,
    username: user.username,
    verificationUrl,
  });
}

export async function resendVerificationEmailByAddress(email: string): Promise<void> {
  const user = await getUserByEmail(email);

  await resendVerificationEmail(user.id);
}

export async function resetPasswordByToken(token: string, password: string): Promise<void> {
  const secret = readServerConfig().secrets.passwordReset;
  const userId = verifyCryptoToken(token, secret);

  const passwordHash = await bcrypt.hash(password, 10);

  await userRepository.updateUserPassword(userId, passwordHash);

  const user = await userRepository.findUserById(userId);

  if (user) {
    await emailClient.sendPasswordChangedEmail({
      email: user.email,
      username: user.username,
      changedAtIso: new Date().toISOString(),
    });
  }
}

export async function sendAdminPasswordReset(userId: number): Promise<void> {
  const user = await getUserById(userId);
  const { token } = buildPasswordResetToken(user.id);
  const resetUrl = buildPasswordResetUrl(token);

  await emailClient.sendPasswordResetEmail({
    email: user.email,
    username: user.username,
    resetUrl,
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    return;
  }

  const { token } = buildPasswordResetToken(user.id);
  const resetUrl = buildPasswordResetUrl(token);

  await emailClient.sendPasswordResetEmail({
    email: user.email,
    username: user.username,
    resetUrl,
  });
}