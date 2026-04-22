// client/src/features/friends/components/friend-detail-panel.tsx
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { Card } from "../../card";
import { cn } from "../../../../lib/utils";

type FriendDetailPanelProps = {
  friend: FriendSummary | null;
};

const statCardClassName = cn(
  "rounded-2xl border border-slate-800 bg-slate-950/50 p-4",
  "transition-[transform,border-color,background-color,box-shadow] duration-800 ease-out",
  "motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]",
  "hover:border-cyan-500/20 hover:bg-slate-950/70 hover:shadow-lg hover:shadow-cyan-950/10",
);



export function FriendDetailPanel({ friend }: FriendDetailPanelProps) {
  if (!friend) {
    return (
      <Card className="rounded-2xl border-slate-800 p-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Friend Summary</h2>
          <p className="text-sm text-slate-400">
            Select a friend to open the detail panel.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
    className={cn(
        "rounded-2xl border-cyan-500/20 bg-slate-900/80 p-6",
        "shadow-[0_30px_80px_-30px_rgba(8,145,178,0.32)]",
        "transition-[transform,border-color,box-shadow] duration-500 ease-out",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.005]",
        "hover:border-cyan-400/25 hover:shadow-[0_36px_96px_-32px_rgba(8,145,178,0.4)]",
    )}
    >
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-200 transition-transform duration-800 motion-safe:hover:scale-105">
          {friend.username.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-slate-100">{friend.username}</h2>
          <p className="truncate text-sm text-slate-400">{friend.email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={statCardClassName}>
          <p className="text-sm text-slate-400">Head-to-head</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>

        <div className={statCardClassName}>
          <p className="text-sm text-slate-400">Net P/L</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>

        <div
          className={cn(
            statCardClassName,
            "sm:col-span-2 lg:col-span-1",
          )}
        >
          <p className="text-sm text-slate-400">Recent wagers</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-400",
          "transition-colors duration-800 ease-out",
          "hover:border-cyan-500/20 hover:bg-slate-950/20",
        )}
      >
        Summary placeholder. Later this panel can consume a dedicated friend summary endpoint.
      </div>
    </Card>
  );
}
