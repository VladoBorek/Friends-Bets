// client/src/features/friends/components/friend-detail-panel.tsx
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { Card } from "../../../components/ui/card";

type FriendDetailPanelProps = {
  friend: FriendSummary | null;
};

export function FriendDetailPanel({ friend }: FriendDetailPanelProps) {
  if (!friend) {
    return (
      <Card className="rounded-2xl border-slate-800 p-6">
        <p className="text-sm text-slate-400">Select a friend to see the summary view.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-cyan-500/20 bg-slate-900/80 p-6 shadow-xl shadow-cyan-950/10">
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-200">
          {friend.username.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-slate-100">{friend.username}</h2>
          <p className="truncate text-sm text-slate-400">{friend.email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-400">Head-to-head</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm text-slate-400">Net P/L</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-sm text-slate-400">Recent wagers</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">--</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-400">
        Summary placeholder. Later this panel can consume a dedicated friend summary endpoint.
      </div>
    </Card>
  );
}
