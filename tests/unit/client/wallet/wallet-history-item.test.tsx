// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletHistoryItemCard } from "@client/features/wallet/components/wallet-history-item";
import type { WalletHistoryItem } from "@pb138/shared/schemas/wallet";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
}));

function makeItem(overrides: Partial<WalletHistoryItem> = {}): WalletHistoryItem {
  return {
    id: 1,
    wagerId: 10,
    wagerName: "World Cup Final",
    type: "bet",
    outcome: "Team A wins",
    walletImpact: "-25.00",
    timestamp: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("WalletHistoryItemCard", () => {
  describe("content", () => {
    it("renders the wager name", () => {
      render(<WalletHistoryItemCard item={makeItem()} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("World Cup Final")).toBeInTheDocument();
    });

    it("renders the formatted timestamp", () => {
      render(<WalletHistoryItemCard item={makeItem()} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("Jan 1, 2024")).toBeInTheDocument();
    });

    it("renders the outcome", () => {
      render(<WalletHistoryItemCard item={makeItem()} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("Team A wins")).toBeInTheDocument();
    });

    it("renders the transaction type", () => {
      render(<WalletHistoryItemCard item={makeItem()} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("bet")).toBeInTheDocument();
    });
  });

  describe("card element type", () => {
    it("renders as a link when type is bet and wagerId is set", () => {
      render(<WalletHistoryItemCard item={makeItem({ type: "bet", wagerId: 10 })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders as a link when type is payout and wagerId is set", () => {
      render(<WalletHistoryItemCard item={makeItem({ type: "payout", wagerId: 10 })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders as a plain card when type is deposit", () => {
      render(<WalletHistoryItemCard item={makeItem({ type: "deposit", wagerId: null })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders as a plain card when type is withdraw", () => {
      render(<WalletHistoryItemCard item={makeItem({ type: "withdraw", wagerId: null })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders as a plain card when wagerId is null even if type is bet", () => {
      render(<WalletHistoryItemCard item={makeItem({ type: "bet", wagerId: null })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("wallet impact colour", () => {
    it("applies green colour for positive wallet impact", () => {
      render(<WalletHistoryItemCard item={makeItem({ walletImpact: "50.00" })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("Wallet impact: 50.00")).toHaveClass("text-emerald-300");
    });

    it("applies red colour for negative wallet impact", () => {
      render(<WalletHistoryItemCard item={makeItem({ walletImpact: "-25.00" })} formattedTimestamp="Jan 1, 2024" />);
      expect(screen.getByText("Wallet impact: -25.00")).toHaveClass("text-rose-300");
    });
  });
});
