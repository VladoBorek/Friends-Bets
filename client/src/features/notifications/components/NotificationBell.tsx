import { Bell, BellDot, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { NotificationItem, PayoutData, WagerResolvedData } from "@pb138/shared/schemas/notifications";
import { useAuth } from "../../../lib/auth-context";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../../api/notifications/notifications-query-options";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { ScrollArea } from "../../../components/ui/scroll-area";

function deriveMessage(notification: NotificationItem): string {
  if (notification.type === "payout") {
    const d = notification.data as Partial<PayoutData>;
    return `You won ${d.amountWon ?? "?"} credits on "${d.wagerTitle ?? "a wager"}"!`;
  }

  if (notification.type === "wager_resolved") {
    const d = notification.data as Partial<WagerResolvedData>;
    const outcome = d.outcomeTitle ? ` "${d.outcomeTitle}" won` : "";
    return `The wager "${d.wagerTitle ?? "a wager"}" was resolved.${outcome}`;
  }

  return "You have a new notification.";
}

function getWagerId(notification: NotificationItem): number | null {
  const d = notification.data as Partial<WagerResolvedData>;
  return typeof d.wagerId === "number" ? d.wagerId : null;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }

    const wagerId = getWagerId(notification);
    if (wagerId !== null) {
      await navigate({ to: "/wagers/$wagerId", params: { wagerId: String(wagerId) } });
    }
  };

  const triggerClass =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-700 text-slate-100 transition-colors hover:bg-slate-600";

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        title="Notifications"
        className={triggerClass}
        render={<button type="button" />}
      >
        {unreadCount > 0 ? <BellDot className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold text-slate-200">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllRead()}
              className="h-auto gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void handleNotificationClick(n)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-slate-800/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-800/50",
                  !n.isRead && "bg-cyan-500/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm leading-snug",
                      n.isRead ? "text-slate-400" : "font-medium text-slate-100",
                    )}
                  >
                    {deriveMessage(n)}
                  </span>
                  {!n.isRead && <Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />}
                </div>
                <span className="text-xs text-slate-500">{formatRelativeTime(n.createdAt)}</span>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
