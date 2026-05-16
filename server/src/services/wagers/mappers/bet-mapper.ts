import type { Bet as BetType } from "@pb138/shared/schemas/wager";
import type { BetDetailRow, BetRow } from "../../../repositories/bet-repository";
import { formatMoney, parseMoney } from "../wager-utils";

export type WagerBet = {
  id: number;
  userId: number;
  username: string;
  outcomeTitle: string;
  amount: string;
};

export function mapBet(row: BetRow): BetType {
  return {
    id: row.id,
    userId: row.userId,
    outcomeId: row.outcomeId,
    amount: parseMoney(row.amount),
    createdAt: (row.createdAt ?? new Date()).toISOString(),
  };
}

export function mapWagerBetSummary(row: BetDetailRow): WagerBet {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    outcomeTitle: row.outcomeTitle,
    amount: formatMoney(parseMoney(row.amount)),
  };
}
