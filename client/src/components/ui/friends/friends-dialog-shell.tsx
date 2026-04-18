import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../dialog";

type FriendsDialogShellProps = {
  title: string;
  contentClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function FriendsDialogShell({
  title,
  contentClassName,
  bodyClassName,
  children,
}: FriendsDialogShellProps) {
  return (
    <DialogContent
      className={cn("border-cyan-500/20 bg-slate-900/95 p-0", contentClassName)}
    >
      <DialogHeader className="border-b border-slate-800 px-6 py-5">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className={cn("flex flex-col gap-4 px-6 py-5", bodyClassName)}>
        {children}
      </div>
    </DialogContent>
  );
}
