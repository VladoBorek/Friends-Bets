import { Button } from "../../../components/ui/utils/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/utils/dialog";
import { Input } from "../../../components/ui/utils/input";

interface WalletBalanceActionDialogProps {
  open: boolean;
  mode: "deposit" | "withdraw" | null;
  balance: string;
  amountInput: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  validationMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onAmountChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function WalletBalanceActionDialog({
  open,
  mode,
  balance,
  amountInput,
  isSubmitting,
  errorMessage,
  validationMessage,
  onOpenChange,
  onAmountChange,
  onSubmit,
  onCancel,
}: WalletBalanceActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b border-slate-800 px-6 py-4">
          <DialogTitle>{mode === "withdraw" ? "Withdraw credits" : "Deposit credits"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 px-6 py-5">
          <DialogDescription className="text-slate-300">
            Real payment processing is not implemented and is out of scope for this project.
          </DialogDescription>

          <div className="grid gap-2">
            <label htmlFor="wallet-action-amount" className="text-sm text-slate-300">
              Amount (credits)
            </label>
            <Input
              id="wallet-action-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="e.g. 25.00"
              disabled={isSubmitting}
            />
            {mode === "withdraw" && (
              <p className="text-xs text-slate-400">Available balance: {Number(balance).toFixed(2)}</p>
            )}
          </div>

          {(errorMessage || amountInput.trim().length > 0) && (errorMessage || validationMessage) && (
            <p className="text-sm text-rose-300">{errorMessage ?? validationMessage}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || Boolean(validationMessage)} className="flex-1">
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
