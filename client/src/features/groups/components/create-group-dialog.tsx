import { useState, type SubmitEventHandler } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createGroup } from "../../../api/groups/groups-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { Button } from "../../../components/ui/utils/button";
import { Dialog } from "../../../components/ui/utils/dialog";
import { Input } from "../../../components/ui/utils/input";
import { Textarea } from "../../../components/ui/utils/textarea";
import { FriendsDialogShell } from "../../friends/components/dialog/friends-dialog-shell";
type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createGroup({
        name,
        description: description.trim() ? description : null,
        memberIds: [],
      }),
    onSuccess: async () => {
      toast.success("Group created");
      setName("");
      setDescription("");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: groupsKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to create group"),
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
      <FriendsDialogShell title="Create Group" contentClassName="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Group name"
            maxLength={80}
          />

          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            maxLength={500}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </FriendsDialogShell>
    </Dialog>
  );
}