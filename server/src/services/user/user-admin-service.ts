import type { UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
import * as userRepository from "../../repositories/user/user-repository";
import { emailClient } from "../email-service";
import { getUserById } from "./user-query-service";

export async function updateUserRole(
  userId: number,
  roleName: "ADMIN" | "PLAYER" | "USER",
): Promise<UserSummary> {
  const roleId = await userRepository.findRoleIdByName(roleName);

  if (!roleId) {
    throw new HttpError({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    });
  }

  await userRepository.updateUserRoleById(userId, roleId);

  return getUserById(userId);
}

export async function suspendUser(
  userId: number,
  durationValue: number,
  durationUnit: "hours" | "days" | "months",
): Promise<UserSummary> {
  const suspensionUntil = new Date();

  if (durationUnit === "hours") {
    suspensionUntil.setHours(suspensionUntil.getHours() + durationValue);
  } else if (durationUnit === "days") {
    suspensionUntil.setDate(suspensionUntil.getDate() + durationValue);
  } else {
    suspensionUntil.setMonth(suspensionUntil.getMonth() + durationValue);
  }

  await userRepository.updateUserSuspension(userId, suspensionUntil);

  const user = await getUserById(userId);

  if (user.suspendedUntil) {
    await emailClient.sendSuspensionEmail({
      email: user.email,
      username: user.username,
      suspendedUntilIso: user.suspendedUntil,
    });
  }

  return user;
}

export async function unsuspendUser(userId: number): Promise<UserSummary> {
  await userRepository.updateUserSuspension(userId, null);

  return getUserById(userId);
}

export async function deleteUser(userId: number): Promise<void> {
  await userRepository.deleteUserById(userId);
}