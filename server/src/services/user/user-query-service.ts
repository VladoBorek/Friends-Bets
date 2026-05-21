import type {
  UserSearchQuery,
  UserSummary,
  UsersListQuery,
} from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
import * as userRepository from "../../repositories/user/user-repository";
import { mapUserSummary } from "./mappers/user-mapper";

export async function getUserById(id: number): Promise<UserSummary> {
  const user = await userRepository.findUserById(id);

  if (!user) {
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  return mapUserSummary(user);
}

export async function listUsers(query: UsersListQuery) {
  const [total, rows] = await Promise.all([
    userRepository.countAllUsers(),
    userRepository.listUsersPaginated(query.limit, query.offset),
  ]);

  const data = rows.map(mapUserSummary);

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}

export async function getUserByEmail(email: string): Promise<UserSummary> {
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  return mapUserSummary(user);
}

export async function searchUsersByEmail(query: UserSearchQuery, excludeUserId: number) {
  const [total, rows] = await Promise.all([
    userRepository.countUsersByEmailPrefix(query.email, excludeUserId),
    userRepository.searchUsersByEmailPrefix(
      query.email,
      excludeUserId,
      query.limit,
      query.offset,
    ),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
  }));

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}