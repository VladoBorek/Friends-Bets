type StatusBadgeProps = { status: string; className?: string };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles =
    status === "OPEN"
      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
      : status === "PENDING"
        ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
        : "border-slate-600 bg-slate-800/50 text-slate-400";
  const label = status === "OPEN" ? "Open" : status === "PENDING" ? "Pending" : "Closed";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles} ${className ?? ""}`}>
      {label}
    </span>
  );
}
