import { Clock3, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/button";

type GroupsPageHeaderProps = {
  hasIncomingInvites: boolean;
  onPendingClick: () => void;
  onCreateClick: () => void;
};

export function GroupsPageHeader({ hasIncomingInvites, onPendingClick, onCreateClick }: GroupsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-slate-100">Groups</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={onPendingClick}
          className="relative gap-2 border border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800"
        >
          <Clock3 className="h-4 w-4" />
          Pending
          {hasIncomingInvites ? <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full border border-slate-950 bg-rose-500" /> : null}
        </Button>

        <Button type="button" onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>
    </div>
  );
}