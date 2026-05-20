import { HttpError } from "../../errors";
import {
  deleteFriendship,
  findFriendshipBetweenUsers,
} from "../../repositories/friends/friend-repository";

export async function removeFriend(currentUserId: number, otherUserId: number): Promise<void> {
  const existing = await findFriendshipBetweenUsers(currentUserId, otherUserId);

  if (!existing || existing.status !== "ACCEPTED") {
    throw new HttpError(404, "NOT_FOUND", "Friendship not found");
  }

  await deleteFriendship(existing.id);
}