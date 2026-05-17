import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { WagerDetail } from "../../../../../shared/src/schemas/wager";

interface WagerActionsMenuProps {
  wager: WagerDetail;
  canEndBetting: boolean;
  canResolve: boolean;
  onEndBetting: () => void;
  onResolve: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WagerActionsMenu({
  wager,
  canEndBetting,
  canResolve,
  onEndBetting,
  onResolve,
  onEdit,
  onDelete,
}: WagerActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasBets = Number(wager.totalPool) > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
        aria-label="Wager actions"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
          {canEndBetting && (
            <button
              type="button"
              onClick={() => { setOpen(false); onEndBetting(); }}
              className="flex w-full px-4 py-2 text-left text-sm text-amber-200 hover:bg-slate-800"
            >
              End Betting
            </button>
          )}
          {canResolve && (
            <button
              type="button"
              onClick={() => { setOpen(false); onResolve(); }}
              className="flex w-full px-4 py-2 text-left text-sm text-emerald-200 hover:bg-slate-800"
            >
              Resolve Wager
            </button>
          )}
          {(canEndBetting || canResolve) && (
            <div className="my-1 border-t border-slate-700" />
          )}

          <span
            title={hasBets ? "Cannot edit a wager that has bets" : undefined}
            className={hasBets ? "cursor-not-allowed" : undefined}
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(); }}
              disabled={hasBets}
              className="flex w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40"
            >
              Edit Wager
            </button>
          </span>

          <span
            title={hasBets ? "Cannot delete a wager that has bets" : undefined}
            className={hasBets ? "cursor-not-allowed" : undefined}
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              disabled={hasBets}
              className="flex w-full px-4 py-2 text-left text-sm text-rose-300 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40"
            >
              Delete Wager
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
