import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@server/errors";
import * as walletRepository from "@server/repositories/wallet/wallet-repository";
import {
  getWalletOverview,
  getWalletTransactionsPaginated,
} from "@server/services/wallet/wallet-query-service";

vi.mock("@server/repositories/wallet/wallet-repository", () => ({
  countTransactionsByWalletId: vi.fn(),
  findWalletByUserId: vi.fn(),
  listTransactionsByWalletId: vi.fn(),
  listTransactionsByWalletIdPaginated: vi.fn(),
}));

describe("wallet-query-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWalletOverview", () => {
    it("returns the wallet balance and mapped transaction history", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 10,
        balance: "123.45",
      });
      vi.mocked(walletRepository.listTransactionsByWalletId).mockResolvedValue([
        {
          id: 1,
          wagerId: null,
          type: "deposit",
          amount: "25.00",
          wagerName: null,
          outcomeName: null,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ]);

      const result = await getWalletOverview(7);

      expect(walletRepository.findWalletByUserId).toHaveBeenCalledWith(7);
      expect(result).toEqual({
        balance: "123.45",
        history: [
          {
            id: 1,
            wagerId: null,
            wagerName: "Wallet deposit",
            type: "deposit",
            outcome: "Funds added",
            walletImpact: "+25.00",
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        ],
      });
    });

    it("throws when the wallet does not exist", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue(null);

      await expect(getWalletOverview(7)).rejects.toBeInstanceOf(HttpError);
      await expect(getWalletOverview(7)).rejects.toMatchObject({
        status: 404,
        code: "WALLET_NOT_FOUND",
      });
    });
  });

  describe("getWalletTransactionsPaginated", () => {
    it("caps the page size, trims search terms, and returns pagination metadata", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 10,
        balance: "123.45",
      });
      vi.mocked(walletRepository.listTransactionsByWalletIdPaginated).mockResolvedValue([
        {
          id: 2,
          wagerId: 8,
          type: "bet",
          amount: "-10.00",
          wagerName: "World Cup Final",
          outcomeName: "Team A wins",
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
        },
      ]);
      vi.mocked(walletRepository.countTransactionsByWalletId).mockResolvedValue(51);

      const result = await getWalletTransactionsPaginated(7, {
        limit: 999,
        offset: -20,
        type: "ALL",
        search: "  cup  ",
      });

      expect(walletRepository.listTransactionsByWalletIdPaginated).toHaveBeenCalledWith(
        10,
        50,
        0,
        undefined,
        "%cup%",
      );
      expect(walletRepository.countTransactionsByWalletId).toHaveBeenCalledWith(
        10,
        undefined,
        "%cup%",
      );
      expect(result).toEqual({
        data: [
          {
            id: 2,
            wagerId: 8,
            wagerName: "World Cup Final",
            type: "bet",
            outcome: "Team A wins",
            walletImpact: "-10.00",
            timestamp: "2024-01-02T00:00:00.000Z",
          },
        ],
        pagination: {
          total: 51,
          limit: 50,
          offset: 0,
          hasMore: true,
        },
      });
    });

    it("filters by transaction type when a specific type is requested", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 10,
        balance: "123.45",
      });
      vi.mocked(walletRepository.listTransactionsByWalletIdPaginated).mockResolvedValue([]);
      vi.mocked(walletRepository.countTransactionsByWalletId).mockResolvedValue(0);

      await getWalletTransactionsPaginated(7, {
        limit: 5,
        offset: 0,
        type: "bet",
        search: "",
      });

      expect(walletRepository.listTransactionsByWalletIdPaginated).toHaveBeenCalledWith(
        10,
        5,
        0,
        "bet",
        undefined,
      );
      expect(walletRepository.countTransactionsByWalletId).toHaveBeenCalledWith(
        10,
        "bet",
        undefined,
      );
    });
  });
});