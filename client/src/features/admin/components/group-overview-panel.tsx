import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import type { AdminGroupSummary } from "../hooks/use-groups";

interface GroupOverviewPanelProps {
  group: AdminGroupSummary;
  onBackToList: () => void;
  onViewMembers: () => void;
}

export function GroupOverviewPanel({ group, onBackToList, onViewMembers }: GroupOverviewPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToList}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{group.name}</h2>
          <p className="text-xs text-slate-500">Group overview</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-xl border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Description</p>
          <p className="mt-2 text-sm text-slate-300">{group.description ? group.description : "—"}</p>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <p className="text-2xl font-semibold text-slate-100">{group.memberCount}</p>
              <p className="text-xs text-slate-500">members</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-emerald-300">{group.activeWagerCount}</p>
              <p className="text-xs text-slate-500">active wagers</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Quick links</p>
          <div className="mt-3 flex flex-col gap-2">
            <Button type="button" onClick={onViewMembers} className="justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All members
              </span>
              <span className="text-xs text-slate-700">View</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { window.location.assign("/wagers"); }}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                All group bets
              </span>
              <span className="text-xs text-slate-400">Open</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { window.location.assign("/groups"); }}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Groups page
              </span>
              <span className="text-xs text-slate-400">Open</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
