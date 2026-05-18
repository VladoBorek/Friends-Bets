import { eq, and } from "drizzle-orm";
import { db } from "../../db/db";
import { Outcome } from "../../db/schema";

export type OutcomeRow = {
  id: number;
  wagerId: number;
  title: string;
  isWinner: boolean | null;
};

const outcomeSelect = {
  id: Outcome.id,
  wagerId: Outcome.wager_id,
  title: Outcome.title,
  isWinner: Outcome.is_winner,
};

export async function findOutcomeById(outcomeId: number): Promise<OutcomeRow | null> {
  const [row] = await db
    .select(outcomeSelect)
    .from(Outcome)
    .where(eq(Outcome.id, outcomeId))
    .limit(1);

  return row ?? null;
}

export async function findOutcomeByIdAndWager(
  outcomeId: number,
  wagerId: number,
): Promise<OutcomeRow | null> {
  const [row] = await db
    .select(outcomeSelect)
    .from(Outcome)
    .where(and(eq(Outcome.id, outcomeId), eq(Outcome.wager_id, wagerId)))
    .limit(1);

  return row ?? null;
}

export async function deleteOutcomesByWager(wagerId: number): Promise<void> {
  await db.delete(Outcome).where(eq(Outcome.wager_id, wagerId));
}

export async function createOutcomes(
  wagerId: number,
  outcomes: Array<{ title: string }>,
): Promise<void> {
  if (outcomes.length === 0) return;

  await db.insert(Outcome).values(
    outcomes.map((outcome) => ({
      wager_id: wagerId,
      title: outcome.title,
    })),
  );
}
