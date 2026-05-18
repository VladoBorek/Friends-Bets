import type { UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
import { mapUserSummary } from "./mappers/user-mapper";
import * as userRepository from "../../repositories/user/user-repository";

export async function getUserById(id: number): Promise<UserSummary> {
  const user = await userRepository.findUserById(id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return mapUserSummary(user);
}

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await userRepository.listAllUsers();
  return rows.map(mapUserSummary);
}

export async function getUserByEmail(email: string): Promise<UserSummary> {
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return mapUserSummary(user);
}

export async function searchUsersByEmail(
  emailQuery: string,
  excludeUserId: number,
): Promise<{ id: number; username: string; email: string }[]> {
  const rows = await userRepository.searchUsersByEmailPrefix(emailQuery, excludeUserId);
  return rows.map(row => ({
    id: row.id,
    username: row.username,
    email: row.email
  }));
}
