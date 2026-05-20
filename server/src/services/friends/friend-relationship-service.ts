import { HttpError } from "../../errors";
import {
  deleteFriendship,
  findFriendshipBetweenUsers,
} from "../../repositories/friends/friend-repository";

export async function removeFriend(currentUserId: number, otherUserId: number): Promise<void> {
  const existing = await findFriendshipBetweenUsers(currentUserId, otherUserId);

  if (!existing || existing.status !== "ACCEPTED") {
    throw new HttpError({
      status: 404,
      code: "FRIEND_NOT_FOUND",
      message: "Friendship not found",
    });
  }

  await deleteFriendship(existing.id);
}