import { Button } from "../../../../components/ui/button";
import { Dialog } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { useCreateGroup } from "../../hooks/use-create-group";
import { FriendsDialogShell } from "../../../friends/components/dialog/friends-dialog-shell";

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { name, setName, description, setDescription, mutation, handleSubmit } = useCreateGroup(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Create Group" contentClassName="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" maxLength={80} />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" maxLength={500} />

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