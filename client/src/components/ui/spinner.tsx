import { cn } from "../../lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400",
        className,
      )}
    />
  );
}
