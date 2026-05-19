import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface DeleteWagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wagerTitle: string;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
}

export function DeleteWagerModal({
  open,
  onOpenChange,
  wagerTitle,
  onConfirm,
  isLoading,
  error,
}: DeleteWagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b border-slate-800 px-6 py-4">
          <DialogTitle>Delete Wager</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5">
          <DialogDescription className="text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-100">"{wagerTitle}"</span>?{" "}
            This action cannot be undone.
          </DialogDescription>
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
              className="flex-1 border border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
            >
              {isLoading ? "Deleting…" : "Delete Wager"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
