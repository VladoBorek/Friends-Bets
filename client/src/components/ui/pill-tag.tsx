import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type PillTagVariant =
  | "status-open"
  | "status-pending"
  | "status-closed"
  | "category"
  | "outcome"
  | "creator"
  | "private";

const variantStyles: Record<PillTagVariant, string> = {
  "status-open":    "border-emerald-500/60 bg-emerald-500/5 text-emerald-200",
  "status-pending": "border-orange-500/60 bg-orange-500/5 text-orange-200",
  "status-closed":  "border-red-500/60 bg-red-500/5 text-red-200",
  "category":       "border-slate-600/50 bg-slate-800/40 text-slate-400",
  "outcome":        "border-violet-500/40 bg-violet-500/15 text-violet-200",
  "creator":        "border-indigo-500/40 bg-indigo-500/15 text-indigo-200",
  "private":        "border-slate-600/50 bg-slate-800/40 text-slate-400",
};

interface PillTagProps {
  variant: PillTagVariant;
  className?: string;
  children: ReactNode;
}

export function PillTag({ variant, className, children }: PillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
