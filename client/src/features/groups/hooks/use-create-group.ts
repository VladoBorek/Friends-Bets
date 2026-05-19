import { useState, type SubmitEventHandler } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createGroup } from "../../../api/groups/groups-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";

export function useCreateGroup(onOpenChange: (open: boolean) => void) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createGroup({
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
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
    if (!name.trim()) return toast.error("Group name is required");
    mutation.mutate();
  };

  return { name, setName, description, setDescription, mutation, handleSubmit };
}