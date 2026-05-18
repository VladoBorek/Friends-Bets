import { describe, it, expect } from "vitest";
import { filterWalletTransactions } from "./wallet-transactions";
import type { WalletHistoryItem } from "../../../../../shared/src/schemas/wallet"

function makeTransaction(overrides: Partial<WalletHistoryItem> = {}): WalletHistoryItem {
  return {
    id: 1,
    wagerId: 1,
    wagerName: "Test Wager",
    type: "bet",
    outcome: "Team A wins",
    walletImpact: "-10.00",
    timestamp: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filterWalletTransactions", () => {
  it("returns empty array when input is empty", () => {
    expect(filterWalletTransactions([], "", "ALL")).toHaveLength(0);
  });

  it("returns all transactions when type is ALL and search is empty", () => {
    const transactions = [
      makeTransaction({ type: "bet" }),
      makeTransaction({ type: "payout" }),
      makeTransaction({ type: "deposit" }),
    ];
    expect(filterWalletTransactions(transactions, "", "ALL")).toHaveLength(3);
  });

  it("filters by transaction type", () => {
    const transactions = [
      makeTransaction({ type: "bet" }),
      makeTransaction({ type: "payout" }),
      makeTransaction({ type: "deposit" }),
    ];
    const result = filterWalletTransactions(transactions, "", "bet");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bet");
  });

  it("returns empty array when no transactions match the type filter", () => {
    const transactions = [makeTransaction({ type: "bet" })];
    expect(filterWalletTransactions(transactions, "", "deposit")).toHaveLength(0);
  });

  it("searches by wagerName case-insensitively", () => {
    const transactions = [
      makeTransaction({ wagerName: "World Cup Final" }),
      makeTransaction({ wagerName: "Office Bet" }),
    ];
    const result = filterWalletTransactions(transactions, "WORLD CUP", "ALL");
    expect(result).toHaveLength(1);
    expect(result[0].wagerName).toBe("World Cup Final");
  });

  it("searches by outcome case-insensitively", () => {
    const transactions = [
      makeTransaction({ outcome: "Team A wins" }),
      makeTransaction({ outcome: "Draw" }),
    ];
    const result = filterWalletTransactions(transactions, "draw", "ALL");
    expect(result).toHaveLength(1);
    expect(result[0].outcome).toBe("Draw");
  });

  it("trims whitespace from search term", () => {
    const transactions = [makeTransaction({ wagerName: "World Cup" })];
    expect(filterWalletTransactions(transactions, "  World Cup  ", "ALL")).toHaveLength(1);
  });

  it("applies type filter and search together", () => {
    const transactions = [
      makeTransaction({ type: "bet", wagerName: "World Cup" }),
      makeTransaction({ type: "payout", wagerName: "World Cup" }),
      makeTransaction({ type: "bet", wagerName: "Office Bet" }),
    ];
    const result = filterWalletTransactions(transactions, "world", "bet");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bet");
    expect(result[0].wagerName).toBe("World Cup");
  });

  it("returns empty array when search matches nothing", () => {
    const transactions = [makeTransaction({ wagerName: "World Cup" })];
    expect(filterWalletTransactions(transactions, "zzz", "ALL")).toHaveLength(0);
  });
});
