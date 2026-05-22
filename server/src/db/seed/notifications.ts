import { faker } from "@faker-js/faker";
import { db } from "../db";
import { Notification } from "../schema";

export async function seedNotifications(users: Array<{ id: number }>) {
  const wagerTitles = ["Who wins the office ping pong tournament?", "First to finish the sprint?", "Will it rain on Friday?"];
  const outcomeTitle = faker.helpers.arrayElement(["Yes", "No", "Team A", "Team B"]);

  await db.insert(Notification).values(
    users.map((user) => {
      const isPayout = faker.datatype.boolean(0.5);
      const wagerId = faker.number.int({ min: 1, max: 10 });
      const wagerTitle = faker.helpers.arrayElement(wagerTitles);

      return {
        user_id: user.id,
        type: isPayout ? "payout" : "wager_resolved",
        data: isPayout
          ? { wagerId, wagerTitle, outcomeTitle, amountWon: String(faker.number.int({ min: 50, max: 500 })) }
          : { wagerId, wagerTitle, outcomeTitle },
        source_key: `${isPayout ? "payout" : "wager_resolved"}:seed:${wagerId}:${user.id}`,
        is_read: faker.datatype.boolean(0.2),
      };
    }),
  );
}