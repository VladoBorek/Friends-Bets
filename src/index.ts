import { desc, eq } from "drizzle-orm";
import { closeConnection, db } from "./db/db";
import { Bet, Outcome, User, Wager } from "./db/schema";

async function main() {
  try {
    const openWagers = await db
      .select({
        id: Wager.id,
        title: Wager.title,
        status: Wager.status,
        creator: User.username,
      })
      .from(Wager)
      .innerJoin(User, eq(Wager.created_by_id, User.id))
      .where(eq(Wager.status, "OPEN"))
      .orderBy(desc(Wager.created_at));

    const recentBets = await db
      .select({
        betId: Bet.id,
        user: User.username,
        outcome: Outcome.title,
        amount: Bet.amount,
      })
      .from(Bet)
      .innerJoin(User, eq(Bet.user_id, User.id))
      .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
      .orderBy(desc(Bet.created_at));

    console.log("Open wagers:", openWagers);
    console.log("Recent bets:", recentBets);
  } catch (error) {
    console.error("Query script failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();
