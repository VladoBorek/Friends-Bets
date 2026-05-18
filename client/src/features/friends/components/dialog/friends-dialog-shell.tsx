import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/utils/dialog";

type FriendsDialogShellProps = {
  title: string;
  contentClassName?: string;
  bodyClassName?: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function FriendsDialogShell({
  title,
  contentClassName,
  bodyClassName,
  headerActions,
  children,
}: FriendsDialogShellProps) {
  return (
    <DialogContent
      className={cn("border-cyan-500/20 bg-slate-900/95 p-0", contentClassName)}
    >
      <DialogHeader className="border-b border-slate-800 px-6 py-5 pr-24">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      {headerActions ? (
        <div className="absolute right-12 top-4 flex items-center gap-2">
          {headerActions}
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-4 px-6 py-5", bodyClassName)}>
        {children}
      </div>
    </DialogContent>
  );
}
