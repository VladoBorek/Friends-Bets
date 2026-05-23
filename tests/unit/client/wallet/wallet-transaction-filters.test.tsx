// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletTransactionFilters } from "@client/features/wallet/components/wallet-transaction-filters";

const defaultProps = {
  search: "",
  typeFilter: "ALL" as const,
  onSearchChange: vi.fn(),
  onTypeFilterChange: vi.fn(),
};

describe("WalletTransactionFilters", () => {
  describe("rendering", () => {
    it("renders the search input", () => {
      render(<WalletTransactionFilters {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders all filter type buttons", () => {
      render(<WalletTransactionFilters {...defaultProps} />);
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bets" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Payouts" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Deposits" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Withdrawals" })).toBeInTheDocument();
    });

    it("shows the current search value in the input", () => {
      render(<WalletTransactionFilters {...defaultProps} search="world cup" />);
      expect(screen.getByRole("textbox")).toHaveValue("world cup");
    });
  });

  describe("interactions", () => {
    it("calls onSearchChange with the typed value when the user types", () => {
      const onSearchChange = vi.fn();
      render(<WalletTransactionFilters {...defaultProps} onSearchChange={onSearchChange} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "world cup" } });
      expect(onSearchChange).toHaveBeenCalledWith("world cup");
    });

    it("calls onTypeFilterChange with the correct value when a filter button is clicked", () => {
      const onTypeFilterChange = vi.fn();
      render(<WalletTransactionFilters {...defaultProps} onTypeFilterChange={onTypeFilterChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Bets" }));
      expect(onTypeFilterChange).toHaveBeenCalledWith("bet");
    });

    it("calls onTypeFilterChange with 'deposit' when Deposits is clicked", () => {
      const onTypeFilterChange = vi.fn();
      render(<WalletTransactionFilters {...defaultProps} onTypeFilterChange={onTypeFilterChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Deposits" }));
      expect(onTypeFilterChange).toHaveBeenCalledWith("deposit");
    });
  });
});
