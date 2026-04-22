import { useEffect, useState } from "react";
import type { WagerDetail } from "../../../../../shared/src/schemas/wager";
import { Card, CardTitle } from "../../../components/ui/card";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import { OUTCOME_COLORS, formatMoney } from "../utils";

type WagerBet = { id: number; userId: number; username: string; outcomeTitle: string; amount: string };

interface BetsSectionProps {
  wagerId: number;
  currentUserId: number | undefined;
  outcomes: WagerDetail["outcomes"];
  refreshKey: number;
}

export function BetsSection({ wagerId, currentUserId, outcomes, refreshKey }: BetsSectionProps) {
  const [bets, setBets] = useState<WagerBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/wagers/${wagerId}/bets`);
        const json = (await res.json().catch(() => null)) as { data?: WagerBet[] } | null;
        setBets(json?.data ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [wagerId, refreshKey]);

  const outcomeColorMap = Object.fromEntries(
    outcomes.map((o, i) => [o.title, OUTCOME_COLORS[i % OUTCOME_COLORS.length]]),
  );

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Bets</CardTitle>
        {!isLoading && bets.length > 0 && (
          <span className="text-sm text-slate-500">
            {bets.length} {bets.length === 1 ? "bet" : "bets"}
          </span>
        )}
      </div>

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading bets…</p>}
      {!isLoading && bets.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No bets placed yet.</p>
      )}
      {!isLoading && bets.length > 0 && (
        <ScrollArea className="mt-4 rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Player</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Outcome</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
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
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </Card>
  );
}
