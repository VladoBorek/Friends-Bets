import { faker } from "@faker-js/faker";
import { db } from "../db";
import { Notification } from "../schema";

export async function seedNotifications(users: Array<{ id: number }>) {
  await db.insert(Notification).values(
    users.map((user) => ({
      user_id: user.id,
      message: faker.helpers.arrayElement([
        "A wager you follow changed status.",
        "A friend invited you to a new wager.",
        "Payout was processed to your wallet.",
      ]),
      type: faker.helpers.arrayElement(["system", "invite", "payout"]),
      is_read: faker.datatype.boolean(0.2),
    })),
  );
}