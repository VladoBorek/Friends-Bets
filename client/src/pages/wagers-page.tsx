import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import type { WagerSummary } from "../../../shared/src/schemas/wager";
import { WagerInlineBetMenu } from "../components/wager-inline-bet-menu";
import { useAuth } from "../lib/auth-context";
import { WagerOutcomeItem } from "../components/wager-outcome-item";

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

export function WagersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wagers, setWagers] = useState<WagerSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBetMenu, setOpenBetMenu] = useState<{ wagerId: number; outcomeId: number } | null>(null);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());

  const navigateToWager = (wagerId: number) => {
    void navigate({ to: "/wagers/$wagerId", params: { wagerId: String(wagerId) } });
  };

  const isOutcomeInteraction = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(target.closest('[data-outcome-interactive="true"]'));
  };

  const toggleOutcomeBetMenu = (wagerId: number, outcomeId: number) => {
    setOpenBetMenu((current) => (
      current?.wagerId === wagerId && current.outcomeId === outcomeId
        ? null
        : { wagerId, outcomeId }
    ));
  };

  const fetchWagers = async (signal?: AbortSignal) => {
    const response = await fetch("/api/wagers", signal ? { signal } : undefined);
    const json = (await response.json().catch(() => null)) as { data?: WagerSummary[]; message?: string } | null;

    if (!response.ok) {
      throw new Error(json?.message ?? "Unable to load wagers");
    }

    return json?.data ?? [];
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadWagers() {
      try {
        const nextWagers = await fetchWagers(controller.signal);
        setWagers(nextWagers);
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
        <Card
          key={wager.id}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (isOutcomeInteraction(event.target)) {
              return;
            }

            navigateToWager(wager.id);
          }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigateToWager(wager.id);
            }
          }}
          className="cursor-pointer transition-colors hover:border-cyan-500/40"
        >
          <CardTitle>{wager.title}</CardTitle>
          <CardDescription className="mt-2">
            {wager.description ?? "No description"}
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">{wager.status}</span>
            <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">Category: {wager.categoryName}</span>
            <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">Creator: {wager.creatorName}</span>
            <span className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 font-semibold text-cyan-100 transition-colors hover:border-cyan-300/70 hover:bg-cyan-500/25">
              Total pool: {formatMoney(wager.totalPool)}
            </span>
            {isSuspended && (
              <span className="rounded-full border border-amber-500/35 px-2 py-1 text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/10">
                Suspended
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {wager.outcomes.map((outcome) => (
              <WagerOutcomeItem
                key={outcome.id}
                outcome={outcome}
                wagerStatus={wager.status}
                currentUserBetAmount={wager.currentUserBetAmount}
                currentUserBetOutcomeTitle={wager.currentUserBetOutcomeTitle}
                onClick={() => toggleOutcomeBetMenu(wager.id, outcome.id)}
                isMenuOpen={openBetMenu?.wagerId === wager.id && openBetMenu.outcomeId === outcome.id}
                menu={(
                  <div data-outcome-interactive="true" className="mt-3">
                    <WagerInlineBetMenu
                      wagerId={wager.id}
                      outcomeId={outcome.id}
                      outcomeTitle={outcome.title}
                      canPlaceBet={wager.status === "OPEN" && !isSuspended && !wager.currentUserBetAmount}
                      disabledMessage={
                        wager.status !== "OPEN"
                          ? "Betting is closed for this wager."
                          : wager.currentUserBetAmount
                            ? `You already placed a bet of ${formatMoney(wager.currentUserBetAmount)} on ${wager.currentUserBetOutcomeTitle ?? "your selected outcome"}.`
                            : isSuspended
                              ? "Suspended users cannot place bets."
                              : "Betting is unavailable for this account."
                      }
                      onBetPlaced={async () => {
                        const nextWagers = await fetchWagers();
                        setWagers(nextWagers);
                      }}
                    />
                  </div>
                )}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
