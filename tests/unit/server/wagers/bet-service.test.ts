import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@server/errors";
import { db } from "@server/db/db";
import * as betRepository from "@server/repositories/wagers/bet-repository";
import * as outcomeRepository from "@server/repositories/wagers/outcome-repository";
import * as wagerRepository from "@server/repositories/wagers/wager-repository";
import { placeBet } from "@server/services/wagers";

vi.mock("@server/db/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@server/repositories/wagers/bet-repository");
vi.mock("@server/repositories/wagers/outcome-repository");
vi.mock("@server/repositories/wagers/wager-repository");

type SelectChain = {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

function createSelectChain(rows: unknown[]): SelectChain {
  const chain: Partial<SelectChain> = {};
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(async () => rows);
  return chain as SelectChain;
}

function createTxMock(options: {
  walletRows: unknown[];
  updateResult: Array<{ id: number }>;
}) {
  const selectChain = createSelectChain(options.walletRows);
  const updateReturning = vi.fn().mockResolvedValue(options.updateResult);
  const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });

  const insertValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
  const insert = vi.fn().mockReturnValue({ values: insertValues });

  return {
    select: vi.fn(() => selectChain),
    update,
    insert,
    selectChain,
    updateSet,
    updateWhere,
    updateReturning,
    insertValues,
  };
}

describe("bet-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("placeBet", () => {
    it("places a bet, deducts the wallet, and records the transaction", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(outcomeRepository.findOutcomeByIdAndWager).mockResolvedValue({
        id: 9,
        wagerId: 5,
        title: "Team A wins",
        isWinner: null,
      });
      vi.mocked(betRepository.findBetByUserAndWager).mockResolvedValue(null);
      vi.mocked(betRepository.createBet).mockResolvedValue({
        id: 41,
        userId: 7,
        outcomeId: 9,
        amount: "25.50",
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
      });

      const userSelect = createSelectChain([
        {
          id: 7,
          isVerified: true,
          suspendedUntil: null,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(userSelect);

      const tx = createTxMock({
        walletRows: [
          {
            id: 11,
            balance: "100.00",
          },
        ],
        updateResult: [{ id: 11 }],
      });
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      const result = await placeBet(5, { outcomeId: 9, amount: 25.5 }, 7);

      expect(betRepository.createBet).toHaveBeenCalledWith({
        userId: 7,
        outcomeId: 9,
        amount: "25.50",
      });
      expect(tx.insert).toHaveBeenCalled();
      expect(tx.insertValues).toHaveBeenCalledWith({
        wallet_id: 11,
        outcome_id: 9,
        type: "bet",
        amount: "-25.50",
      });
      expect(result).toEqual({
        id: 41,
        userId: 7,
        outcomeId: 9,
        amount: 25.5,
        createdAt: "2024-01-02T00:00:00.000Z",
      });
    });

    it("rejects bets on non-open wagers", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "CLOSED",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });

      await expect(placeBet(5, { outcomeId: 9, amount: 25.5 }, 7)).rejects.toMatchObject({
        status: 400,
        code: "WAGER_NOT_OPEN",
      });
      expect(outcomeRepository.findOutcomeByIdAndWager).not.toHaveBeenCalled();
    });

    it("rejects unverified users before creating the bet", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });

      const userSelect = createSelectChain([
        {
          id: 7,
          isVerified: false,
          suspendedUntil: null,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(userSelect);

      await expect(placeBet(5, { outcomeId: 9, amount: 25.5 }, 7)).rejects.toMatchObject({
        status: 403,
        code: "AUTH_FORBIDDEN",
      });
      expect(outcomeRepository.findOutcomeByIdAndWager).not.toHaveBeenCalled();
      expect(betRepository.createBet).not.toHaveBeenCalled();
    });

    it("rejects duplicate bets for the same user and wager", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(outcomeRepository.findOutcomeByIdAndWager).mockResolvedValue({
        id: 9,
        wagerId: 5,
        title: "Team A wins",
        isWinner: null,
      });
      vi.mocked(betRepository.findBetByUserAndWager).mockResolvedValue({
        id: 99,
        userId: 7,
        outcomeId: 9,
        amount: "25.50",
        createdAt: new Date(),
      });

      const userSelect = createSelectChain([
        {
          id: 7,
          isVerified: true,
          suspendedUntil: null,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(userSelect);

      await expect(placeBet(5, { outcomeId: 9, amount: 25.5 }, 7)).rejects.toMatchObject({
        status: 409,
        code: "BET_ALREADY_EXISTS",
      });
      expect(betRepository.createBet).not.toHaveBeenCalled();
    });

    it("rejects bets when the wallet balance is too low", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(outcomeRepository.findOutcomeByIdAndWager).mockResolvedValue({
        id: 9,
        wagerId: 5,
        title: "Team A wins",
        isWinner: null,
      });
      vi.mocked(betRepository.findBetByUserAndWager).mockResolvedValue(null);

      const userSelect = createSelectChain([
        {
          id: 7,
          isVerified: true,
          suspendedUntil: null,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(userSelect);

      const tx = createTxMock({
        walletRows: [
          {
            id: 11,
            balance: "10.00",
          },
        ],
        updateResult: [],
      });
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      await expect(placeBet(5, { outcomeId: 9, amount: 25.5 }, 7)).rejects.toMatchObject({
        status: 400,
        code: "WALLET_INSUFFICIENT_BALANCE",
      });
      expect(betRepository.createBet).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it("rejects bets when the user wallet cannot be found", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 5,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 1,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(outcomeRepository.findOutcomeByIdAndWager).mockResolvedValue({
        id: 9,
        wagerId: 5,
        title: "Team A wins",
        isWinner: null,
      });
      vi.mocked(betRepository.findBetByUserAndWager).mockResolvedValue(null);

      const userSelect = createSelectChain([
        {
          id: 7,
          isVerified: true,
          suspendedUntil: null,
        },
      ]);
      vi.mocked(db.select).mockReturnValue(userSelect);

      const tx = createTxMock({
        walletRows: [],
        updateResult: [],
      });
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      await expect(placeBet(5, { outcomeId: 9, amount: 25.5 }, 7)).rejects.toMatchObject({
        status: 404,
        code: "WALLET_NOT_FOUND",
      });
    });
  });
});