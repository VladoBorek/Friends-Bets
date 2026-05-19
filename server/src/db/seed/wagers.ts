import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { Bet, Category, Comment, GroupMembership, Outcome, Wager, WagerVisibility } from "../schema";
import { seedConfig } from "./config";
import { pickSome, toMoney } from "./utils";

export async function seedCategories() {
  return db.insert(Category).values(seedConfig.categories.map((name) => ({ name }))).returning();
}

function buildGroupWagerTitle(groupName: string, categoryName: string): string {
  const titlesByCategory: Record<string, string[]> = {
    Challenges: [
      "Will the team finish the task before Friday?",
      "Will anyone keep the weekly habit streak?",
      "Will the bug count stay under five?",
      "Will the challenge be completed without extensions?",
    ],
    Versus: [
      "Head-to-head: who wins the rematch?",
      "Who gets the better score this week?",
      "Which side finishes first?",
      "Who takes the final round?",
    ],
    Predictions: [
      "How many people show up on time?",
      "Will the plan change before the weekend?",
      "Will the final result beat expectations?",
      "How many tasks get closed today?",
    ],
    Sports: [
      "Will the home team win?",
      "Total goals over or under 2.5?",
      "Who wins the weekend match?",
      "Will the favorite cover the spread?",
    ],
    Entertainment: [
      "Which movie wins movie night?",
      "Will the finale be rated above 8/10?",
      "Who wins the trivia round?",
      "Will the game night run past midnight?",
    ],
    School: [
      "Will the assignment be submitted before noon?",
      "Will the exam average be above 75 percent?",
      "Will the presentation finish under time?",
      "Will the project demo pass first try?",
    ],
    Work: [
      "Will the sprint goal be reached?",
      "Will the meeting end early?",
      "Will production stay incident-free?",
      "Will the release happen today?",
    ],
  };

  return `${groupName}: ${faker.helpers.arrayElement(titlesByCategory[categoryName] ?? titlesByCategory.Predictions)}`;
}

function buildOutcomes(categoryName: string): string[] {
  if (categoryName === "Versus") return ["Team A", "Team B"];
  if (categoryName === "Sports") return ["Home Win", "Draw", "Away Win"];
  if (categoryName === "Entertainment") return ["Yes", "No", "Surprise Result"];
  return ["Yes", "No"];
}

export async function seedWagers(params: {
  users: Array<{ id: number; username: string }>;
  categories: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}) {
  const createdWagers: Array<{ id: number; status: string }> = [];

  for (const group of params.groups) {
    const memberships = await db
      .select({ userId: GroupMembership.user_id })
      .from(GroupMembership)
      .where(eq(GroupMembership.group_id, group.id));

    const memberIds = memberships.map((membership) => membership.userId);
    const groupUsers = params.users.filter((user) => memberIds.includes(user.id));

    if (groupUsers.length < 2) continue;

    const wagerCount = faker.number.int({ min: 5, max: 9 });

    for (let index = 0; index < wagerCount; index += 1) {
      const category = faker.helpers.arrayElement(params.categories);
      const status = faker.helpers.weightedArrayElement([
        { weight: 5, value: "OPEN" as const },
        { weight: 2, value: "PENDING" as const },
        { weight: 4, value: "CLOSED" as const },
      ]);
      const outcomes = buildOutcomes(category.name);
      const creator = faker.helpers.arrayElement(groupUsers);

      const [wager] = await db.insert(Wager).values({
        title: buildGroupWagerTitle(group.name, category.name),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        status,
        category_id: category.id,
        created_by_id: creator.id,
        group_id: group.id,
        is_public: false,
        pool: "0",
        created_at: faker.date.recent({ days: 45 }),
      }).returning();

      createdWagers.push({ id: wager.id, status });

      const winningIndex = status === "CLOSED" ? faker.number.int({ min: 0, max: outcomes.length - 1 }) : -1;

      const outcomeRows = await db.insert(Outcome).values(
        outcomes.map((title, outcomeIndex) => ({
          wager_id: wager.id,
          title,
          is_winner: outcomeIndex === winningIndex,
        })),
      ).returning();

      const bettors = pickSome(groupUsers, Math.min(3, groupUsers.length), Math.min(9, groupUsers.length));
      let pool = 0;

      for (const bettor of bettors) {
        const outcome = faker.helpers.arrayElement(outcomeRows);
        const amount = faker.number.int({ min: 10, max: 120 });
        pool += amount;

        await db.insert(Bet).values({
          user_id: bettor.id,
          outcome_id: outcome.id,
          amount: toMoney(amount),
          created_at: faker.date.recent({ days: 30 }),
        });
      }

      await db.update(Wager).set({ pool: toMoney(pool) }).where(eq(Wager.id, wager.id));

      await db.insert(WagerVisibility).values(
        groupUsers.map((user) => ({
          wager_id: wager.id,
          user_id: user.id,
        })),
      );

      const commenters = pickSome(groupUsers, 1, Math.min(4, groupUsers.length));

      await db.insert(Comment).values(
        commenters.map((user) => ({
          wager_id: wager.id,
          user_id: user.id,
          content: faker.helpers.arrayElement([
            "I like these odds.",
            "This one feels risky.",
            "No way this goes as expected.",
            "Easy pick.",
            "I am only joining for the chaos.",
            "This will be close.",
          ]),
          created_at: faker.date.recent({ days: 20 }),
        })),
      );
    }
  }

  return createdWagers;
}