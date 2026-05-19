import { Inbox, Send } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { PendingFriendRequestTab } from "../../utils/friend-requests";

type PendingRequestTabsProps = {
  activeTab: PendingFriendRequestTab;
  counts: Record<PendingFriendRequestTab, number>;
  onTabChange: (tab: PendingFriendRequestTab) => void;
};

export function PendingRequestTabs({ activeTab, counts, onTabChange }: PendingRequestTabsProps) {
  return (
    <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-slate-950/60 p-1">
      {(["incoming", "outgoing"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === tab ? "bg-cyan-500/15 text-cyan-100" : "text-slate-400 hover:text-slate-100",
          )}
        >
          {tab === "incoming" ? <Inbox className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {tab === "incoming" ? "Incoming" : "Outgoing"}
          <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{counts[tab]}</span>
        </button>
      ))}
    </div>
  );
}