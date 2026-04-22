import type { WagerDetail } from "../../../../../shared/src/schemas/wager";
import { OUTCOME_COLORS } from "../utils";

type PoolBarProps = { outcomes: WagerDetail["outcomes"] };

export function PoolBar({ outcomes }: PoolBarProps) {
  const total = outcomes.reduce((s, o) => s + Number(o.totalBet), 0);
  const equal = 100 / outcomes.length;

  return (
    <div className="grid gap-2">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {outcomes.map((o, i) => {
          const pct = total > 0 ? (Number(o.totalBet) / total) * 100 : equal;
          return (
            <div
              key={o.id}
              className={`${OUTCOME_COLORS[i % OUTCOME_COLORS.length].bar} opacity-80 transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${o.title}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {outcomes.map((o, i) => {
          const pct = total > 0 ? (Number(o.totalBet) / total) * 100 : equal;
          const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
          return (
            <div key={o.id} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${color.dot}`} />
              <span className="text-xs text-slate-400">{o.title}</span>
              <span className={`text-xs font-medium ${color.label}`}>{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
