import { PillTag, type PillTagVariant } from "../../../components/ui/pill-tag";

type StatusBadgeProps = { status: string; className?: string };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: PillTagVariant =
    status === "OPEN" ? "status-open" : status === "PENDING" ? "status-pending" : "status-closed";
  const label = status === "OPEN" ? "Open" : status === "PENDING" ? "Pending" : "Closed";
  return <PillTag variant={variant} className={className}>{label}</PillTag>;
}
