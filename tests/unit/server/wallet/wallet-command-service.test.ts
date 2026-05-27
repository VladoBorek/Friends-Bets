import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@server/errors";
import { db } from "@server/db/db";
import * as walletRepository from "@server/repositories/wallet/wallet-repository";
import { depositToWallet, withdrawFromWallet } from "@server/services/wallet";

vi.mock("@server/db/db", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("@server/repositories/wallet/wallet-repository");

type TransactionRow = {
  id: number;
  createdAt: Date;
};

function createTxMock(options: {
  updateResult: Array<{ id: number; balance: string }>;
  insertResult: TransactionRow[];
}) {
  const updateReturning = vi.fn().mockResolvedValue(options.updateResult);
  const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });

  const insertReturning = vi.fn().mockResolvedValue(options.insertResult);
  const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
  const insert = vi.fn().mockReturnValue({ values: insertValues });

  return {
    update,
    insert,
    updateSet,
    updateWhere,
    updateReturning,
    insertValues,
    insertReturning,
  };
}

describe("wallet-command-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("depositToWallet", () => {
    it("credits the wallet and records a deposit transaction", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 11,
        balance: "100.00",
      });

      const tx = createTxMock({
        updateResult: [{ id: 11, balance: "125.46" }],
        insertResult: [{ id: 21, createdAt: new Date("2024-01-01T00:00:00.000Z") }],
      });

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      const result = await depositToWallet(7, 25.456);

      expect(walletRepository.findWalletByUserId).toHaveBeenCalledWith(7);
      expect(result).toEqual({
        balance: "125.46",
        transaction: {
          id: 21,
          wagerId: null,
          wagerName: "Wallet deposit",
          type: "deposit",
          outcome: "Funds added",
          walletImpact: "+25.46",
          timestamp: "2024-01-01T00:00:00.000Z",
        },
      });
    });

    it("rejects invalid deposit amounts before opening a transaction", async () => {
      await expect(depositToWallet(7, 0)).rejects.toMatchObject({
        status: 400,
        code: "BAD_REQUEST",
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("fails when the wallet update does not return a row", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 11,
        balance: "100.00",
      });

      const tx = createTxMock({
        updateResult: [],
        insertResult: [],
      });

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      await expect(depositToWallet(7, 25)).rejects.toMatchObject({
        status: 400,
        code: "WALLET_INSUFFICIENT_BALANCE",
      });
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it("fails when the transaction insert does not return a row", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 11,
        balance: "100.00",
      });

      const tx = createTxMock({
        updateResult: [{ id: 11, balance: "125.00" }],
        insertResult: [],
      });

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      await expect(depositToWallet(7, 25)).rejects.toMatchObject({
        status: 500,
        code: "WALLET_TRANSACTION_FAILED",
      });
    });
  });

  describe("withdrawFromWallet", () => {
    it("debits the wallet and records a withdrawal transaction", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 11,
        balance: "100.00",
      });

      const tx = createTxMock({
        updateResult: [{ id: 11, balance: "79.50" }],
        insertResult: [{ id: 31, createdAt: new Date("2024-01-02T00:00:00.000Z") }],
      });

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      const result = await withdrawFromWallet(7, 20.5);

      expect(result).toEqual({
        balance: "79.50",
        transaction: {
          id: 31,
          wagerId: null,
          wagerName: "Wallet withdrawal",
          type: "withdraw",
          outcome: "Funds removed",
          walletImpact: "-20.50",
          timestamp: "2024-01-02T00:00:00.000Z",
        },
      });
    });

    it("rejects withdrawals that exceed the available balance", async () => {
      vi.mocked(walletRepository.findWalletByUserId).mockResolvedValue({
        id: 11,
        balance: "10.00",
      });

      const tx = createTxMock({
        updateResult: [],
        insertResult: [],
      });

      vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));

      await expect(withdrawFromWallet(7, 20)).rejects.toMatchObject({
        status: 400,
        code: "WALLET_INSUFFICIENT_BALANCE",
      });
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it("rejects invalid withdrawal amounts before opening a transaction", async () => {
      await expect(withdrawFromWallet(7, -1)).rejects.toMatchObject({
        status: 400,
        code: "BAD_REQUEST",
      });
      expect(db.transaction).not.toHaveBeenCalled();
    });
  });
});