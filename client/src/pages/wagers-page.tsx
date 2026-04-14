import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import type { WagerSummary } from "../../../shared/src/schemas/wager";

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

export function WagersPage() {
  const [wagers, setWagers] = useState<WagerSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWagers() {
      try {
        const response = await fetch("/api/wagers", { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: WagerSummary[]; message?: string } | null;

        if (!response.ok) {
          throw new Error(json?.message ?? "Unable to load wagers");
        }

        setWagers(json?.data ?? []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load wagers");
      } finally {
        setIsLoading(false);
      }
    }

    void loadWagers();

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <p className="text-slate-300">Loading wagers...</p>;
  }

  if (error) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!wagers?.length) {
    return <p className="text-slate-300">No wagers found. Seed the database and create your first wager.</p>;
  }

  return (
    <div className="grid gap-4">
      {wagers.map((wager) => (
        <Card key={wager.id} className="transition-colors hover:border-cyan-500/40">
          <CardTitle>{wager.title}</CardTitle>
          <CardDescription className="mt-2">
            {wager.description ?? "No description"}
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 px-2 py-1">{wager.status}</span>
            <span>Category: {wager.categoryName}</span>
            <span>Creator: {wager.creatorName}</span>
            <span>Total pool: {formatMoney(wager.totalPool)}</span>
            {wager.currentUserBetAmount && (
              <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-emerald-300">
                Your bet: {formatMoney(wager.currentUserBetAmount)} on {wager.currentUserBetOutcomeTitle ?? "selected outcome"}
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {wager.outcomes.map((outcome) => (
              <div key={outcome.id} className="rounded-md border border-slate-800 bg-slate-950/50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{outcome.title}</span>
                  <span className="text-cyan-300">{outcome.odds ? `${outcome.odds}x` : "n/a"}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Bet volume: {formatMoney(outcome.totalBet)}</p>
              </div>
            ))}
          </div>
          <Link
            to="/wagers/$wagerId"
            params={{ wagerId: String(wager.id) }}
            className="mt-4 inline-flex text-sm text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Open detail
          </Link>
        </Card>
      ))}
    </div>
  );
}
