import { listBetsByWager, listWinningBets } from "../../repositories/wagers/bet-repository";
import { findWagerById, listWagerOutcomes } from "../../repositories/wagers/wager-repository";
import { calculatePayout, formatMoney, parseMoney } from "../wagers/wager-utils";
import type { CreateNotificationInput } from "./channels/types";

export async function findWagerResolutionTargets(wagerId: number): Promise<CreateNotificationInput[]> {
  const [wager, allBets, outcomes] = await Promise.all([
    findWagerById(wagerId),
    listBetsByWager(wagerId),
    listWagerOutcomes(wagerId),
  ]);

  if (!wager || allBets.length === 0) {
    return [];
  }

  const winningOutcome = outcomes.find((o) => o.isWinner);
  if (!winningOutcome) {
    return [];
  }

  const winningBets = await listWinningBets(winningOutcome.id, wagerId);

  const totalPool = outcomes.reduce((sum, o) => sum + parseMoney(o.totalBet), 0);
  const winningPool = parseMoney(winningOutcome.totalBet);

  const winnerIds = new Set(winningBets.map((b) => b.userId));
  const winnerPayouts = new Map<number, string>();

  if (winningPool > 0 && totalPool > 0) {
    for (const bet of winningBets) {
      const stake = parseMoney(bet.amount);
      const payout = calculatePayout(totalPool, stake, winningPool);
      winnerPayouts.set(bet.userId, formatMoney(payout));
    }
  }

  return allBets.map((bet) => {
    const isWinner = winnerIds.has(bet.userId);
    if (isWinner) {
      return {
        userId: bet.userId,
        type: "payout",
        data: {
          wagerId,
          wagerTitle: wager.title,
          outcomeTitle: winningOutcome.title,
          amountWon: winnerPayouts.get(bet.userId) ?? "0.00",
        },
        sourceKey: `payout:${wagerId}:${bet.userId}`,
      };
    }

    return {
      userId: bet.userId,
      type: "wager_resolved",
      data: {
        wagerId,
        wagerTitle: wager.title,
        outcomeTitle: winningOutcome.title,
      },
      sourceKey: `wager_resolved:${wagerId}:${bet.userId}`,
    };
  });
}
