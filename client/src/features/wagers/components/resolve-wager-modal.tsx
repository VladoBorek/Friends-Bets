import { useState } from "react";
import type { WagerDetail } from "../../../../../shared/src/schemas/wager";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface ResolveWagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outcomes: WagerDetail["outcomes"];
  onConfirm: (outcomeId: number) => void;
  isLoading: boolean;
  error: string | null;
}

export function ResolveWagerModal({
  open,
  onOpenChange,
  outcomes,
  onConfirm,
  isLoading,
  error,
}: ResolveWagerModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(outcomes[0]?.id ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b border-slate-800 px-6 py-4">
          <DialogTitle>Resolve Wager</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <DialogDescription className="text-slate-300">
            Select the winning outcome to close betting and distribute payouts.
          </DialogDescription>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Winning outcome
            <select
              value={selectedId?.toString() ?? ""}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            >
              <option value="" disabled>Select an outcome</option>
              {outcomes.map((o) => (
                <option key={o.id} value={o.id.toString()}>{o.title}</option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => { if (selectedId) onConfirm(selectedId); }}
              disabled={isLoading || !selectedId}
              className="flex-1 border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
            >
              {isLoading ? "Resolving…" : "Resolve Wager"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
