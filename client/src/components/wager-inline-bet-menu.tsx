import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { BET_AMOUNT_ERROR_MESSAGE } from "../../../shared/src/schemas/wager";

function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const value = error as {
      response?: { data?: unknown };
      message?: unknown;
    };

    if (typeof value.response?.data === "string" && value.response.data.trim()) {
      return value.response.data;
    }

    if (value.response?.data && typeof value.response.data === "object") {
      const data = value.response.data as {
        message?: unknown;
        issues?: Array<{ message?: unknown }>;
      };
      const firstIssueMessage = data.issues?.find((issue) => typeof issue.message === "string")?.message;
      if (typeof firstIssueMessage === "string" && firstIssueMessage.trim()) {
        return firstIssueMessage;
      }

      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
  }

  return "Request failed";
}

function validateBetAmount(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  const amount = Number(trimmedValue);
  if (!Number.isFinite(amount) || amount < 0.01) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  if (!Number.isInteger(amount * 100)) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  return null;
}

interface WagerInlineBetMenuProps {
  wagerId: number;
  outcomeId: number;
  outcomeTitle: string;
  canPlaceBet: boolean;
  disabledMessage: string;
  onBetPlaced?: () => Promise<void> | void;
}

export function WagerInlineBetMenu({
  wagerId,
  outcomeId,
  outcomeTitle,
  canPlaceBet,
  disabledMessage,
  onBetPlaced,
}: WagerInlineBetMenuProps) {
  const [betAmount, setBetAmount] = useState("");
  const [betError, setBetError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setBetError(null);

    if (!canPlaceBet) {
      setBetError(disabledMessage);
      return;
    }

    const validationMessage = validateBetAmount(betAmount);
    if (validationMessage) {
      setBetError(validationMessage);
      return;
    }

    const amount = Number(betAmount);

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/wagers/${wagerId}/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId, amount }),
      });
      const json = (await response.json().catch(() => ({}))) as { data?: { id?: number }; message?: string } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Failed to place bet");
      }

      setSuccessMessage(json?.data?.id ? `Bet placed successfully (id ${json.data.id})` : "Bet placed successfully");
      setBetAmount("");
      await onBetPlaced?.();
    } catch (submitError) {
      setBetError(toErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canPlaceBet) {
    return (
      <div className="mt-3 rounded-md border border-slate-700 bg-slate-950/70 p-3">
        <p className="text-xs text-slate-300">{disabledMessage}</p>
      </div>
    );
  }

  return (
    <form className="mt-3 rounded-md border border-cyan-500/35 bg-cyan-500/10 p-3" onSubmit={submitBet} noValidate>
      <p className="text-xs text-cyan-200">
        Place bet on <span className="font-semibold text-cyan-100">{outcomeTitle}</span>
      </p>
      <label className="mt-2 flex flex-col gap-1 text-xs text-slate-300">
        Amount
        <Input
          value={betAmount}
          onChange={(event) => {
            const nextValue = event.target.value;
            setBetAmount(nextValue);
            if (!nextValue.trim()) {
              setBetError(null);
              return;
            }

            setBetError(validateBetAmount(nextValue));
          }}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
        />
      </label>

      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Placing..." : "Place Bet"}
        </Button>
      </div>

      {successMessage && <p className="mt-2 text-xs text-emerald-300">{successMessage}</p>}
      {betError && <p className="mt-2 text-xs text-rose-300">{betError}</p>}
    </form>
  );
}