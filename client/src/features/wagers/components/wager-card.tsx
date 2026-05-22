import type { WagerSummary } from "@pb138/shared/schemas/wager";
import { Card, CardTitle } from "../../../components/ui/card";
import { PillTag, type PillTagVariant } from "../../../components/ui/pill-tag";
import { formatMoney, OUTCOME_COLORS } from "../utils/utils";

interface WagerCardProps {
  wager: WagerSummary;
  currentUserId?: number;
  onClick: () => void;
}

function statusVariant(status: string): PillTagVariant {
  if (status === "OPEN") return "status-open";
  if (status === "PENDING") return "status-pending";
  return "status-closed";
}

function statusLabel(status: string) {
  if (status === "OPEN") return "Open";
  if (status === "PENDING") return "Pending";
  return "Closed";
}

export function WagerCard({ wager, currentUserId, onClick }: WagerCardProps) {
  const isCreator = currentUserId !== undefined && wager.createdById === currentUserId;
  const totalPool = Number(wager.totalPool);
  const hasBet = Number(wager.currentUserBetAmount ?? 0) > 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer transition-colors hover:border-cyan-500/40"
    >
      {/* Primary: title + status + creator indicator */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <CardTitle className="flex-1 text-base leading-snug">{wager.title}</CardTitle>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <PillTag variant={statusVariant(wager.status)}>{statusLabel(wager.status)}</PillTag>
          {isCreator && <PillTag variant="creator">Created by me</PillTag>}
        </div>
      </div>

      {/* Secondary: pool + my bet */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-500">Pool</span>
          <span className="font-semibold tabular-nums text-cyan-300">{formatMoney(wager.totalPool)}</span>
        </div>
        {hasBet && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500">My bet</span>
            <span className="font-semibold tabular-nums text-emerald-300">
              {formatMoney(wager.currentUserBetAmount ?? "0")}
            </span>
            {wager.currentUserBetOutcomeTitle && (
              <span className="text-xs text-slate-400">on {wager.currentUserBetOutcomeTitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Tertiary: outcomes (left) + category/visibility (right) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {wager.outcomes.map((outcome, i) => {
            const pct = totalPool > 0 ? Math.round((Number(outcome.totalBet) / totalPool) * 100) : 0;
            const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
            return (
              <PillTag key={outcome.id} variant="outcome" className={color.pill}>
                {outcome.title} ({pct}%)
              </PillTag>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PillTag variant="category">{wager.categoryName}</PillTag>
          {!wager.isPublic && <PillTag variant="private">Private</PillTag>}
        </div>
      </div>
    </Card>
  );
}
