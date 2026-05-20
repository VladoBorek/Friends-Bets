import { useCallback, useEffect, useState } from "react";
import {
  paginatedWagerBetsResponseSchema,
  type WagerDetail,
} from "@pb138/shared/schemas/wager";
import { readJsonOrThrow } from "../../../api/http";
import { Card, CardTitle } from "../../../components/ui/card";
import { OUTCOME_COLORS, formatMoney } from "../utils/utils";

const BETS_BATCH_SIZE = 10;
const LOAD_MORE_THRESHOLD_PX = 160;

type WagerBet = { id: number; userId: number; username: string; outcomeTitle: string; amount: string };
type PaginationState = { total: number; limit: number; offset: number; hasMore: boolean };

interface BetsSectionProps {
  wagerId: number;
  currentUserId: number | undefined;
  outcomes: WagerDetail["outcomes"];
  refreshKey: number;
}

export function BetsSection({ wagerId, currentUserId, outcomes, refreshKey }: BetsSectionProps) {
  const [bets, setBets] = useState<WagerBet[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBets = useCallback(async (offset: number, mode: "replace" | "append") => {
    if (mode === "append") setIsLoadingMore(true);
    else setIsInitialLoading(true);

    try {
      setErrorMessage(null);

      const params = new URLSearchParams({
        limit: String(BETS_BATCH_SIZE),
        offset: String(offset),
      });

      const response = await fetch(`/api/wagers/${wagerId}/bets?${params.toString()}`, {
        credentials: "same-origin",
      });

      const json = paginatedWagerBetsResponseSchema.parse(
        await readJsonOrThrow(response, "Unable to load bets"),
      );

      setBets((current) => {
        if (mode === "replace") return json.data;

        const seen = new Set(current.map((bet) => bet.id));
        return [...current, ...json.data.filter((bet) => !seen.has(bet.id))];
      });
      setPagination(json.pagination);
    } catch (error) {
      if (mode === "replace") {
        setBets([]);
        setPagination(null);
      }

      setErrorMessage(error instanceof Error ? error.message : "Unable to load bets");
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [wagerId]);

  useEffect(() => {
    void loadBets(0, "replace");
  }, [loadBets, refreshKey]);

  const hasMore = pagination?.hasMore ?? false;
  const totalBets = pagination?.total ?? bets.length;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isInitialLoading || isLoadingMore) return;

    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
      void loadBets(bets.length, "append");
    }
  };

  const outcomeColorMap = Object.fromEntries(
    outcomes.map((o, i) => [o.title, OUTCOME_COLORS[i % OUTCOME_COLORS.length]]),
  );

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Bets</CardTitle>
        {!isInitialLoading && totalBets > 0 && (
          <span className="text-sm text-slate-500">
            {totalBets} {totalBets === 1 ? "bet" : "bets"}
          </span>
        )}
      </div>

      {isInitialLoading && <p className="mt-3 text-sm text-slate-500">Loading bets...</p>}
      {errorMessage && <p className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
      {!isInitialLoading && !errorMessage && bets.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No bets placed yet.</p>
      )}

      {!isInitialLoading && !errorMessage && bets.length > 0 && (
        <div
          onScroll={handleScroll}
          className="mt-4 max-h-80 overflow-auto rounded-lg border border-slate-800"
        >
          <table className="w-full min-w-[520px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-800/60 bg-slate-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Player</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Outcome</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-slate-800/60">
              {bets.map((bet) => {
                const color = outcomeColorMap[bet.outcomeTitle];
                const isMe = bet.userId === currentUserId;

                return (
                  <tr key={bet.id} className={isMe ? "bg-cyan-500/5" : "hover:bg-slate-800/30"}>
                    <td className="px-4 py-2.5">
                      <span className={isMe ? "font-medium text-cyan-300" : "text-slate-300"}>
                        {bet.username}
                        {isMe && <span className="ml-1.5 text-xs text-slate-500">(you)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {color && <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />}
                        <span className="text-slate-400">{bet.outcomeTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-200">
                      {formatMoney(bet.amount)}
                    </td>
                  </tr>
                );
              })}
              {isLoadingMore && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center text-xs text-slate-500">
                    Loading more bets...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}