import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-slate-700 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-semibold text-slate-100", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-300", className)} {...props} />;
}

export function PremiumCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-cyan-500/20 bg-gradient-to-br from-slate-900/92 via-slate-900/86 to-cyan-950/24 shadow-lg shadow-slate-950/25 transition-shadow duration-200 hover:shadow-[0_20px_44px_-24px_rgba(8,145,178,0.7)]",
        className,
      )}
      {...props}
    />
  );
}

export function PremiumCardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs font-medium uppercase tracking-[0.22em] text-cyan-200/80", className)} {...props} />
  );
}

export function PremiumCardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 text-3xl font-semibold tracking-tight text-slate-100", className)} {...props} />;
}
