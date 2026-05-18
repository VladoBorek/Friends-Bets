import { db } from "../db";
import { Friendship } from "../schema";

export async function seedFriendships(users: Array<{ id: number }>) {
  const primaryUser = users[0];
  const otherUsers = users.slice(1);

  const acceptedRows = otherUsers.slice(0, 16).map((user) => ({
    requester_id: primaryUser.id,
    addressee_id: user.id,
    status: "ACCEPTED",
    responded_at: new Date(),
  }));

  const incomingRows = otherUsers.slice(16, 22).map((user) => ({
    requester_id: user.id,
    addressee_id: primaryUser.id,
    status: "PENDING",
  }));

  const outgoingRows = otherUsers.slice(22, 28).map((user) => ({
    requester_id: primaryUser.id,
    addressee_id: user.id,
    status: "PENDING",
  }));

  const rows = [...acceptedRows, ...incomingRows, ...outgoingRows];

  if (rows.length > 0) {
    await db.insert(Friendship).values(rows);
  }
}