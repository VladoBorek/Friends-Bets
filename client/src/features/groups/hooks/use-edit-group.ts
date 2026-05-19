import { useEffect, useState, type SubmitEventHandler } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { updateGroup } from "../../../api/groups/groups-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";

export function useEditGroup(
  group: GroupSummary | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onGroupUpdated?: (group: GroupSummary) => void,
) {
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
    if (!name.trim()) return toast.error("Group name is required");
    mutation.mutate();
  };

  return { name, setName, description, setDescription, mutation, handleSubmit };
}