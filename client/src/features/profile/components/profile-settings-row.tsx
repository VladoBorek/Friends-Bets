import type { ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

interface ProfileSettingsRowProps {
  label: string;
  value?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ProfileSettingsRow({
  label,
  value,
  actionLabel = "Change",
  onAction,
  rightSlot,
  children,
  className,
}: ProfileSettingsRowProps) {
  return (
    <div className={cn("grid gap-4 border-b border-slate-800/80 py-5 last:border-b-0", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-100">{label}</p>
          {value ? <p className="text-sm text-slate-400">{value}</p> : null}
        </div>
        {onAction ? (
          <Button type="button" variant="secondary" size="sm" onClick={onAction} className="w-fit">
            {actionLabel}
          </Button>
        ) : (
          rightSlot ?? null
        )}
      </div>
      {children}
    </div>
  );
}
