import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@server/db/db";
import { HttpError } from "@server/errors";
import * as betRepository from "@server/repositories/wagers/bet-repository";
import * as categoryRepository from "@server/repositories/wagers/category-repository";
import * as outcomeRepository from "@server/repositories/wagers/outcome-repository";
import * as wagerRepository from "@server/repositories/wagers/wager-repository";
import * as wagerVisibilityRepository from "@server/repositories/wagers/wager-visibility-repository";
import { handleWagerResolved } from "@server/services/notifications/notification-service";
import {
  closeWagerBetting,
  createWager,
  deleteWager,
  resolveWager,
  updateWager,
} from "@server/services/wagers";

vi.mock("@server/db/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@server/repositories/wagers/category-repository");
vi.mock("@server/repositories/wagers/bet-repository");
vi.mock("@server/repositories/wagers/outcome-repository");
vi.mock("@server/repositories/wagers/wager-repository", () => ({
  createWager: vi.fn(),
  deleteWagerById: vi.fn(),
  findWagerById: vi.fn(),
  findWagerByIdWithDetails: vi.fn(),
  listWagerOutcomes: vi.fn(),
  updateOutcomeWinner: vi.fn(),
  updateWagerFields: vi.fn(),
  updateWagerStatus: vi.fn(),
  wagerHasBets: vi.fn(),
}));
vi.mock("@server/repositories/wagers/wager-visibility-repository");
vi.mock("@server/services/notifications/notification-service", () => ({
  handleWagerResolved: vi.fn().mockResolvedValue(undefined),
}));

type SelectChain = {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

function createSelectChain(results: unknown[][]): SelectChain {
  const chain: Partial<SelectChain> = {};
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(async () => results.shift() ?? []);
  return chain as SelectChain;
}

function createTxMock() {
  return {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  };
}

describe("wager-command-service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(handleWagerResolved).mockResolvedValue(undefined);
  });

  describe("createWager", () => {
    it("creates a wager with outcomes and optional invitations", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 2, name: "Sports" });
      vi.mocked(db.select).mockReturnValue(
        createSelectChain([
          [
            {
              id: 7,
              isVerified: true,
              suspendedUntil: null,
            },
          ],
        ]),
      );
      vi.mocked(wagerRepository.createWager).mockResolvedValue(55);
      vi.mocked(outcomeRepository.createOutcomes).mockResolvedValue();
      vi.mocked(wagerVisibilityRepository.createWagerVisibilities).mockResolvedValue();
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: "Who wins?",
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 1, title: "Team A", isWinner: false, totalBet: "10.00" },
        { id: 2, title: "Team B", isWinner: false, totalBet: "20.00" },
      ]);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(createTxMock() as never));

      const result = await createWager(
        {
          title: "Championship Final",
          description: "Who wins?",
          categoryId: 2,
          isPublic: false,
          outcomes: [{ title: "Team A" }, { title: "Team B" }],
          invitedUserIds: [11, 12],
        },
        7,
      );

      expect(wagerRepository.createWager).toHaveBeenCalledWith({
        title: "Championship Final",
        description: "Who wins?",
        categoryId: 2,
        createdById: 7,
        isPublic: false,
      });
      expect(outcomeRepository.createOutcomes).toHaveBeenCalledWith(55, [
        { title: "Team A" },
        { title: "Team B" },
      ]);
      expect(wagerVisibilityRepository.createWagerVisibilities).toHaveBeenCalledWith(55, [11, 12]);
      expect(result).toMatchObject({
        id: 55,
        title: "Championship Final",
        totalPool: "30.00",
        outcomes: [
          { id: 1, title: "Team A", totalBet: "10.00", isWinner: false },
          { id: 2, title: "Team B", totalBet: "20.00", isWinner: false },
        ],
      });
    });

    it("rejects unverified creators", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 2, name: "Sports" });
      vi.mocked(db.select).mockReturnValue(
        createSelectChain([
          [
            {
              id: 7,
              isVerified: false,
              suspendedUntil: null,
            },
          ],
        ]),
      );

      await expect(
        createWager(
          {
            title: "Championship Final",
            categoryId: 2,
            isPublic: true,
            outcomes: [{ title: "Team A" }, { title: "Team B" }],
          },
          7,
        ),
      ).rejects.toMatchObject({
        status: 403,
        code: "AUTH_FORBIDDEN",
      });
    });
  });

  describe("updateWager", () => {
    it("rejects edits from non-creators", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });

      await expect(
        updateWager(
          55,
          {
            title: "Updated Title",
            categoryId: 2,
            isPublic: true,
            outcomes: [{ title: "Team A" }, { title: "Team B" }],
          },
          99,
        ),
      ).rejects.toMatchObject({
        status: 403,
        code: "WAGER_FORBIDDEN",
      });
    });

    it("updates an open wager and recreates its outcomes and visibility list", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 3, name: "Entertainment" });
      vi.mocked(wagerRepository.wagerHasBets).mockResolvedValue(false);
      vi.mocked(wagerRepository.updateWagerFields).mockResolvedValue();
      vi.mocked(outcomeRepository.deleteOutcomesByWager).mockResolvedValue();
      vi.mocked(outcomeRepository.createOutcomes).mockResolvedValue();
      vi.mocked(wagerVisibilityRepository.deleteWagerVisibilities).mockResolvedValue();
      vi.mocked(wagerVisibilityRepository.createWagerVisibilities).mockResolvedValue();
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Updated Title",
        description: "Updated description",
        status: "OPEN",
        categoryId: 3,
        categoryName: "Entertainment",
        createdById: 7,
        creatorName: "creator",
        isPublic: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 3, title: "Team C", isWinner: false, totalBet: "5.00" },
        { id: 4, title: "Team D", isWinner: false, totalBet: "15.00" },
      ]);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(createTxMock() as never));

      const result = await updateWager(
        55,
        {
          title: "Updated Title",
          description: "Updated description",
          categoryId: 3,
          isPublic: false,
          outcomes: [{ title: "Team C" }, { title: "Team D" }],
          invitedUserIds: [22],
        },
        7,
      );

      expect(wagerRepository.updateWagerFields).toHaveBeenCalledWith(55, {
        title: "Updated Title",
        description: "Updated description",
        categoryId: 3,
        isPublic: false,
      });
      expect(wagerVisibilityRepository.deleteWagerVisibilities).toHaveBeenCalledWith(55);
      expect(wagerVisibilityRepository.createWagerVisibilities).toHaveBeenCalledWith(55, [22]);
      expect(result).toMatchObject({
        id: 55,
        title: "Updated Title",
        totalPool: "20.00",
        outcomes: [
          { id: 3, title: "Team C", totalBet: "5.00" },
          { id: 4, title: "Team D", totalBet: "15.00" },
        ],
      });
    });
  });

  describe("closeWagerBetting", () => {
    it("moves an open wager into pending status", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.updateWagerStatus).mockResolvedValue();
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 1, title: "Team A", isWinner: false, totalBet: "10.00" },
      ]);
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "PENDING",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });

      const result = await closeWagerBetting(55, 7);

      expect(wagerRepository.updateWagerStatus).toHaveBeenCalledWith(55, "PENDING");
      expect(result.status).toBe("PENDING");
    });
  });

  describe("resolveWager", () => {
    it("settles winning bets and pays out each winner", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "PENDING",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "CLOSED",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "CLOSED",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValueOnce([
        { id: 1, title: "Team A", isWinner: false, totalBet: "60.00" },
        { id: 2, title: "Team B", isWinner: false, totalBet: "40.00" },
      ]);
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 1, title: "Team A", isWinner: true, totalBet: "60.00" },
        { id: 2, title: "Team B", isWinner: false, totalBet: "40.00" },
      ]);
      vi.mocked(betRepository.listWinningBets).mockResolvedValue([
        { id: 11, userId: 21, amount: "30.00" },
        { id: 12, userId: 22, amount: "10.00" },
      ]);
      vi.mocked(wagerRepository.updateWagerStatus).mockResolvedValue();
      vi.mocked(wagerRepository.updateOutcomeWinner).mockResolvedValue();

      const walletSelect = createSelectChain([
        [
          {
            id: 101,
            balance: "50.00",
          },
        ],
        [
          {
            id: 102,
            balance: "25.00",
          },
        ],
      ]);
      vi.mocked(db.select).mockReturnValue(walletSelect);

      const walletUpdateReturning = vi.fn().mockResolvedValue([{ id: 101 }]);
      const walletUpdateWhere = vi.fn().mockReturnValue({ returning: walletUpdateReturning });
      const walletUpdateSet = vi.fn().mockReturnValue({ where: walletUpdateWhere });
      const walletInsertValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });
      vi.mocked(db.update).mockReturnValue({ set: walletUpdateSet } as never);
      vi.mocked(db.insert).mockReturnValue({ values: walletInsertValues } as never);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(createTxMock() as never));

      const result = await resolveWager(55, { outcomeId: 1 });

      expect(wagerRepository.updateWagerStatus).toHaveBeenCalledWith(55, "CLOSED");
      expect(wagerRepository.updateOutcomeWinner).toHaveBeenCalledWith(55, 1);
      expect(walletInsertValues).toHaveBeenNthCalledWith(1, {
        wallet_id: 101,
        outcome_id: 1,
        type: "payout",
        amount: "50.00",
      });
      expect(walletInsertValues).toHaveBeenNthCalledWith(2, {
        wallet_id: 102,
        outcome_id: 1,
        type: "payout",
        amount: "16.67",
      });
      expect(handleWagerResolved).toHaveBeenCalledWith(55);
      expect(result.status).toBe("CLOSED");
      expect(result.outcomes).toEqual([
        { id: 1, title: "Team A", odds: "1.67", totalBet: "60.00", isWinner: true },
        { id: 2, title: "Team B", odds: "2.50", totalBet: "40.00", isWinner: false },
      ]);
    });

    it("closes a wager without payouts when nobody bet on the winning outcome", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValueOnce({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "CLOSED",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 1, title: "Team A", isWinner: false, totalBet: "60.00" },
        { id: 2, title: "Team B", isWinner: false, totalBet: "40.00" },
      ]);
      vi.mocked(betRepository.listWinningBets).mockResolvedValue([]);
      vi.mocked(wagerRepository.updateWagerStatus).mockResolvedValue();
      vi.mocked(wagerRepository.updateOutcomeWinner).mockResolvedValue();

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(createTxMock() as never));

      const result = await resolveWager(55, { outcomeId: 1 });

      expect(wagerRepository.updateWagerStatus).toHaveBeenCalledWith(55, "CLOSED");
      expect(db.update).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
      expect(result.status).toBe("CLOSED");
    });

    it("rejects invalid winning outcomes before changing wager state", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });
      vi.mocked(wagerRepository.listWagerOutcomes).mockResolvedValue([
        { id: 1, title: "Team A", isWinner: false, totalBet: "60.00" },
      ]);
      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(createTxMock() as never));

      await expect(resolveWager(55, { outcomeId: 999 })).rejects.toMatchObject({
        status: 400,
        code: "OUTCOME_NOT_FOUND",
      });
      expect(wagerRepository.updateWagerStatus).not.toHaveBeenCalled();
      expect(wagerRepository.updateOutcomeWinner).not.toHaveBeenCalled();
    });
  });

  describe("deleteWager", () => {
    it("rejects deletes from non-creators", async () => {
      vi.mocked(wagerRepository.findWagerByIdWithDetails).mockResolvedValue({
        id: 55,
        title: "Championship Final",
        description: null,
        status: "OPEN",
        categoryId: 2,
        categoryName: "Sports",
        createdById: 7,
        creatorName: "creator",
        isPublic: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        currentUserBetAmount: null,
        currentUserBetOutcomeTitle: null,
      });

      await expect(deleteWager(55, 99)).rejects.toMatchObject({
        status: 403,
        code: "WAGER_FORBIDDEN",
      });
    });
  });
});