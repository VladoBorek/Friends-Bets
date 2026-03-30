import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useGetWagerById } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";

type WagerDetailPageProps = {
  wagerId: number;
};

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const wager = useGetWagerById(wagerId);

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
      const response = await fetch(`/api/wagers/${detail.id}/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user,
          outcomeId: selectedOutcomeId,
          amount,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || response.statusText || "Failed to place bet";
        throw new Error(message);
      }

      const data = await response.json();
      setMessage(`Bet placed successfully (id ${data.data.id})`);
      setBetAmount("");
      setIsSubmitting(false);
      wager.refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place bet");
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
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Outcome
            <select
              value={selectedOutcomeId ?? ""}
              onChange={(event) => setSelectedOutcomeId(Number(event.target.value))}
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            >
              {detail.outcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Amount
            <input
              value={betAmount}
              onChange={(event) => setBetAmount(event.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            />
          </label>

          {message && <p className="text-emerald-300">{message}</p>}
          {error && <p className="text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || detail.status !== "OPEN"}
            className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {isSubmitting ? "Placing bet..." : "Place Bet"}
          </button>

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
