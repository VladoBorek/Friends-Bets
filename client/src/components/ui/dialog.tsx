import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> & {
  children: React.ReactNode;
};

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          "transition-opacity duration-200",
        )}
      />
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <BaseDialog.Popup
          ref={ref}
          className={cn(
            "relative w-[calc(100vw-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/95 shadow-[0_24px_80px_-24px_rgba(8,145,178,0.35)] backdrop-blur",
            "max-h-[85vh]",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "transition duration-200",
            className,
          )}
          {...props}
        >
          <div className="pointer-events-auto">
            {children}
            <BaseDialog.Close
              className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="Close"
              render={<button type="button" />}
            >
              <X className="h-4 w-4" />
            </BaseDialog.Close>
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  ),
);

DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn("text-xl font-semibold text-slate-100", className)}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn("text-sm text-slate-400", className)}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";
