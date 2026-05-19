import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface EndBettingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
}

export function EndBettingModal({ open, onOpenChange, onConfirm, isLoading, error }: EndBettingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b border-slate-800 px-6 py-4">
          <DialogTitle>End Betting Period</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <DialogDescription className="text-slate-300">
            Are you sure you want to end the betting period? Once closed,{" "}
            <span className="font-semibold text-amber-200">no new bets can be placed</span>.
          </DialogDescription>
          <p className="text-xs text-slate-500">
            The wager moves to <span className="text-amber-300">Pending</span> while you determine the outcome.
          </p>
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
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
            >
              {isLoading ? "Ending…" : "End Betting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
