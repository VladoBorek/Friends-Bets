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
  "status-open":    "border-emerald-500/60 bg-emerald-500/5 text-emerald-500/100",
  "status-pending": "border-orange-500/60 bg-orange-500/5 text-orange-500/100",
  "status-closed":  "border-red-500/60 bg-red-500/5 text-red-500/70",
  "category":       "border-slate-400/60 bg-slate-500/15 text-slate-300",
  "outcome":        "border-violet-500/40 bg-violet-500/15 text-violet-500/100",
  "creator":        "border-indigo-500/40 bg-indigo-500/15 text-indigo-500/100",
  "private":        "border-slate-400/60 bg-slate-500/15 text-slate-300",
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
