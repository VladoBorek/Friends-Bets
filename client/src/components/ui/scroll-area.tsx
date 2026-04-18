import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "../../lib/utils";

export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root>
>(({ className, children, ...props }, ref) => (
  <BaseScrollArea.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <BaseScrollArea.Viewport className="size-full rounded-[inherit]">
      <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
  </BaseScrollArea.Root>
));

ScrollArea.displayName = "ScrollArea";

type ScrollBarProps = React.ComponentPropsWithoutRef<typeof BaseScrollArea.Scrollbar>;

export const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <BaseScrollArea.Scrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-3 rounded-full bg-slate-700/35 p-[3px]",
        orientation === "horizontal" && "h-3 flex-col rounded-full bg-slate-700/35 p-[3px]",
        className,
      )}
      {...props}
    >
      <BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-slate-400/60 transition-colors hover:bg-slate-300/75" />
    </BaseScrollArea.Scrollbar>
  ),
);

ScrollBar.displayName = "ScrollBar";
