import type {
  WagerDetail,
  WagerSummary,
} from "@pb138/shared/schemas/wager";
import type { WagerBaseRow, WagerOutcomeRow } from "../../../repositories/wager-repository";
import { calculateOdds, formatMoney, normalizeStatus, parseMoney } from "../wager-utils";

export function mapWagerOutcome(row: WagerOutcomeRow, totalPool: number) {
  return {
    id: row.id,
    title: row.title,
    odds: calculateOdds(totalPool, parseMoney(row.totalBet)),
    totalBet: formatMoney(parseMoney(row.totalBet)),
    isWinner: row.isWinner ?? false,
  };
}

export function mapWagerSummary(row: WagerBaseRow, outcomes: WagerOutcomeRow[]): WagerSummary {
  const currentUserBetAmount = parseMoney(row.currentUserBetAmount);
  const totalPool = outcomes.reduce((sum, current) => sum + parseMoney(current.totalBet), 0);

  const normalizedOutcomes = outcomes.map((outcome) => mapWagerOutcome(outcome, totalPool));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: normalizeStatus(row.status),
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    createdById: row.createdById,
    creatorName: row.creatorName,
    isPublic: row.isPublic ?? false,
    createdAt: row.createdAt?.toISOString() ?? null,
    totalPool: formatMoney(totalPool),
    currentUserBetAmount: currentUserBetAmount > 0 ? formatMoney(currentUserBetAmount) : null,
    currentUserBetOutcomeTitle: currentUserBetAmount > 0 ? row.currentUserBetOutcomeTitle : null,
    outcomes: normalizedOutcomes,
  };
}

export function mapWagerDetail(row: WagerBaseRow, outcomes: WagerOutcomeRow[]): WagerDetail {
  const totalPool = outcomes.reduce((sum, outcome) => sum + parseMoney(outcome.totalBet), 0);

  return {
    ...mapWagerSummary(row, outcomes),
    outcomes: outcomes.map((outcome) => mapWagerOutcome(outcome, totalPool)),
  };
}
