import type { ReactNode } from "react";

type WagerStatus = "OPEN" | "PENDING" | "CLOSED";

interface WagerOutcomeItemProps {
  outcome: {
    id: number;
    title: string;
    odds: string | null;
    totalBet: string;
    isWinner: boolean;
  };
  wagerStatus: WagerStatus;
  currentUserBetAmount: string | null;
  currentUserBetOutcomeTitle: string | null;
  onClick: () => void;
  isMenuOpen: boolean;
  menu?: ReactNode;
  interactionAttribute?: string;
}

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

export function WagerOutcomeItem({
  outcome,
  wagerStatus,
  currentUserBetAmount,
  currentUserBetOutcomeTitle,
  onClick,
  isMenuOpen,
  menu,
  interactionAttribute = "data-outcome-interactive",
}: WagerOutcomeItemProps) {
  const isCurrentUserOutcome = Boolean(currentUserBetAmount && currentUserBetOutcomeTitle === outcome.title);
  const isWinningOutcome = wagerStatus === "CLOSED" && outcome.isWinner;
  const interactionProps = { [interactionAttribute]: "true" };

  return (
    <div
      {...interactionProps}
      className={`rounded-md border p-3 text-sm transition-colors ${
        isWinningOutcome
          ? "border-amber-400/70 bg-amber-500/5 hover:border-amber-300 hover:bg-amber-500/10"
          : isCurrentUserOutcome
          ? "border-emerald-400/60 bg-emerald-500/10 hover:border-emerald-400/80 hover:bg-emerald-500/20"
          : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
      }`}
    >
      <button
        type="button"
        {...interactionProps}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="flex w-full cursor-pointer flex-col gap-2 rounded-sm text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-100">{outcome.title}</p>
            {isCurrentUserOutcome && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-200">
                Your bet: {formatMoney(currentUserBetAmount ?? "0")}
              </span>
            )}
          </div>
          <p className="text-sm text-cyan-300">{outcome.odds ? `${outcome.odds}x` : "n/a"}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">Bet volume: {formatMoney(outcome.totalBet)}</p>
          {isWinningOutcome && <span className="text-[11px] text-amber-300">Winning outcome</span>}
        </div>
      </button>

      {isMenuOpen && menu}
    </div>
  );
}