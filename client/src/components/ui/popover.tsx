import * as React from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cn } from "../../lib/utils";

export function Popover(props: React.ComponentProps<typeof BasePopover.Root>) {
  return <BasePopover.Root {...props} />;
}

export function PopoverTrigger(props: React.ComponentProps<typeof BasePopover.Trigger>) {
  return <BasePopover.Trigger {...props} />;
}

export function PopoverClose(props: React.ComponentProps<typeof BasePopover.Close>) {
  return <BasePopover.Close {...props} />;
}

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BasePopover.Popup> & { align?: "start" | "center" | "end" }
>(({ className, align = "end", ...props }, ref) => (
  <BasePopover.Portal>
    <BasePopover.Positioner align={align} sideOffset={8}>
      <BasePopover.Popup
        ref={ref}
        className={cn(
          "z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-xl",
          "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
          "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
          "transition duration-150 origin-top",
          className,
        )}
        {...props}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
));

PopoverContent.displayName = "PopoverContent";
