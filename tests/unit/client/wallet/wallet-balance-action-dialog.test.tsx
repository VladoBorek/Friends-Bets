// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletBalanceActionDialog } from "@client/features/wallet/components/wallet-balance-action-dialog";

vi.mock("@client/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

const defaultProps = {
  open: true,
  mode: "deposit" as const,
  balance: "100.00",
  amountInput: "",
  isSubmitting: false,
  errorMessage: null,
  validationMessage: null,
  onOpenChange: vi.fn(),
  onAmountChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe("WalletBalanceActionDialog", () => {
  describe("title", () => {
    it('shows "Deposit credits" in deposit mode', () => {
      render(<WalletBalanceActionDialog {...defaultProps} mode="deposit" />);
      expect(screen.getByRole("heading", { name: "Deposit credits" })).toBeInTheDocument();
    });

    it('shows "Withdraw credits" in withdraw mode', () => {
      render(<WalletBalanceActionDialog {...defaultProps} mode="withdraw" />);
      expect(screen.getByRole("heading", { name: "Withdraw credits" })).toBeInTheDocument();
    });
  });

  describe("available balance", () => {
    it("shows available balance in withdraw mode", () => {
      render(<WalletBalanceActionDialog {...defaultProps} mode="withdraw" balance="150.00" />);
      expect(screen.getByText("Available balance: 150.00")).toBeInTheDocument();
    });

    it("does not show available balance in deposit mode", () => {
      render(<WalletBalanceActionDialog {...defaultProps} mode="deposit" />);
      expect(screen.queryByText(/Available balance/)).not.toBeInTheDocument();
    });
  });

  describe("confirm button", () => {
    it("is enabled when there is no validation message and not submitting", () => {
      render(<WalletBalanceActionDialog {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
    });

    it("is disabled when a validation message is present", () => {
      render(<WalletBalanceActionDialog {...defaultProps} validationMessage="Amount too low" />);
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    });

    it("shows Processing... and is disabled while submitting", () => {
      render(<WalletBalanceActionDialog {...defaultProps} isSubmitting={true} />);
      expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
    });
  });

  describe("error and validation messages", () => {
    it("shows error message when errorMessage is provided", () => {
      render(<WalletBalanceActionDialog {...defaultProps} errorMessage="Something went wrong" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("shows validation message when amountInput has content and validationMessage is set", () => {
      render(
        <WalletBalanceActionDialog
          {...defaultProps}
          amountInput="0"
          validationMessage="Amount must be at least 0.01"
        />,
      );
      expect(screen.getByText("Amount must be at least 0.01")).toBeInTheDocument();
    });

    it("does not show validation message when amountInput is empty and there is no errorMessage", () => {
      render(
        <WalletBalanceActionDialog
          {...defaultProps}
          amountInput=""
          validationMessage="Amount must be at least 0.01"
          errorMessage={null}
        />,
      );
      expect(screen.queryByText("Amount must be at least 0.01")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when the cancel button is clicked", () => {
      const onCancel = vi.fn();
      render(<WalletBalanceActionDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("calls onAmountChange with the typed value when the amount input changes", () => {
      const onAmountChange = vi.fn();
      render(<WalletBalanceActionDialog {...defaultProps} onAmountChange={onAmountChange} />);
      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "25" } });
      expect(onAmountChange).toHaveBeenCalledWith("25");
    });
  });
});
