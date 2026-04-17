import { HttpError } from "../../errors";
import { deleteFriendship, findFriendshipBetweenUsers } from "../../repositories/friend-repository";

export async function removeFriend(currentUserId: number, otherUserId: number): Promise<void> {
  const existing = await findFriendshipBetweenUsers(currentUserId, otherUserId);

  if (!existing || existing.status !== "ACCEPTED") {
    throw new HttpError(404, "Friendship not found");
  }

  await deleteFriendship(existing.id);
}