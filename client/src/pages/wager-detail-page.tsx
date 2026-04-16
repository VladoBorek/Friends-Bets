import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useGetWagerById, usePlaceBet } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type WagerDetailPageProps = {
  wagerId: number;
};

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
      const data = value.response.data as { message?: unknown };
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
  }

  return "Failed to place bet";
}

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const wager = useGetWagerById(wagerId);
  const placeBet = usePlaceBet();

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [userId, setUserId] = useState("1");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detail = wager.data?.data ?? null;

  useEffect(() => {
    if (detail && selectedOutcomeId === null) {
      setSelectedOutcomeId(detail.outcomes[0]?.id ?? null);
    }
  }, [detail, selectedOutcomeId]);

  if (wager.isLoading) {
    return <p className="text-slate-300">Loading wager detail...</p>;
  }

  if (wager.error || !detail) {
    return <p className="text-rose-300">Wager not found.</p>;
  }

  const submitBet = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!selectedOutcomeId) {
      setError("Please select an outcome");
      return;
    }

    const amount = Number(betAmount);
    const user = Number(userId);

    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid bet amount");
      return;
    }

    if (Number.isNaN(user) || user <= 0) {
      setError("Enter a valid user id");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeBet.mutateAsync({
        id: detail.id,
        data: {
          userId: user,
          outcomeId: selectedOutcomeId,
          amount,
        },
      });

      const betId = result.data?.id;
      setMessage(betId ? `Bet placed successfully (id ${betId})` : "Bet placed successfully");
      setBetAmount("");
      await wager.refetch();
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>{detail.title}</CardTitle>
        <CardDescription className="mt-2">{detail.description ?? "No description"}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-2 py-1">{detail.status}</span>
          <span>Category: {detail.categoryName}</span>
          <span>Creator: {detail.creatorName}</span>
        </div>
      </Card>

      <Card>
        <CardTitle>Outcomes</CardTitle>
        <div className="mt-4 grid gap-2">
          {detail.outcomes.map((outcome) => (
            <div key={outcome.id} className="flex items-center justify-between rounded-md border border-slate-700 p-3">
              <p>{outcome.title}</p>
              <p className="text-sm text-slate-300">odds: {outcome.odds ?? "n/a"}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Place a bet</CardTitle>
        <form className="mt-4 grid gap-3" onSubmit={submitBet}>
          <div className="grid gap-2">
            <label className="text-xs text-slate-300" htmlFor="userId">
              User ID
            </label>
            <Input
              id="userId"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-slate-300" htmlFor="outcome">
              Outcome
            </label>
            <select
              id="outcome"
              value={selectedOutcomeId ?? ""}
              onChange={(event) => setSelectedOutcomeId(Number(event.target.value))}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              {detail.outcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-slate-300" htmlFor="amount">
              Amount
            </label>
            <Input
              id="amount"
              value={betAmount}
              onChange={(event) => setBetAmount(event.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
          </div>

          {message && <p className="text-emerald-300">{message}</p>}
          {error && <p className="text-rose-300">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting || detail.status !== "OPEN"}
            className="w-full"
          >
            {isSubmitting ? "Placing bet..." : "Place Bet"}
          </Button>

          {detail.status !== "OPEN" && (
            <p className="text-xs text-slate-400">Cannot place bets on wagers that are not OPEN.</p>
          )}
        </form>
      </Card>

      <Link to="/wagers" className="text-sm text-cyan-300 transition-colors hover:text-cyan-200">
        Back to list
      </Link>
    </div>
  );
}
