import { type SubmitEventHandler, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { updateGroup } from "../../../api/groups/groups-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { Button } from "../utils/button";
import { Dialog } from "../utils/dialog";
import { FriendsDialogShell } from "../friends/dialog/friends-dialog-shell";
import { Input } from "../utils/input";
import { Textarea } from "../utils/textarea";

type EditGroupDialogProps = {
  group: GroupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: (group: GroupSummary) => void;
};

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
  onGroupUpdated,
}: EditGroupDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!group || !open) return;

    setName(group.name);
    setDescription(group.description ?? "");
  }, [group, open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!group) throw new Error("Group is missing");

      return updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      });
    },
    onSuccess: async (updatedGroup) => {
      toast.success("Group updated");
      onGroupUpdated?.(updatedGroup);
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: groupsKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to update group"),
  });

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Edit Group" contentClassName="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Name
            </span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              disabled={mutation.isPending}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Description
            </span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              disabled={mutation.isPending}
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
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
