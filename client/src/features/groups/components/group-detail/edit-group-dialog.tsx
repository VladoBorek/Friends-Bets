import { Check, X } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { Button } from "../../../../components/ui/button";
import { Dialog } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { FriendsDialogShell } from "../../../friends/components/dialog/friends-dialog-shell";
import { useEditGroup } from "../../hooks/use-edit-group";

type EditGroupDialogProps = {
  group: GroupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: (group: GroupSummary) => void;
};

export function EditGroupDialog({ group, open, onOpenChange, onGroupUpdated }: EditGroupDialogProps) {
  const { name, setName, description, setDescription, mutation, handleSubmit } = useEditGroup(group, open, onOpenChange, onGroupUpdated);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Edit Group" contentClassName="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} disabled={mutation.isPending} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Description</span>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} disabled={mutation.isPending} />
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" className="gap-2" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              <X className="h-4 w-4" />
              Cancel
            </Button>

            <Button type="submit" className="gap-2" disabled={mutation.isPending}>
              <Check className="h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </FriendsDialogShell>
    </Dialog>
  );
}