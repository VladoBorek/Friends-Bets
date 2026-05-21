import { useState } from "react";
import { Crown, Ellipsis, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { GroupMemberSummary } from "@pb138/shared/schemas/groups";

interface GroupMemberActionMenuProps {
  member: GroupMemberSummary;
  members: GroupMemberSummary[];
  index: number;
  onRemove: (userId: number, newOwnerId?: number) => Promise<void>;
  onChangeOwner: (newOwnerId: number) => Promise<void>;
  setFeedback: (feedback: { type: "success" | "error"; message: string } | null) => void;
}

export function GroupMemberActionMenu({
  member,
  members,
  index,
  onRemove,
  onChangeOwner,
  setFeedback,
}: GroupMemberActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOwnerPrompt, setShowOwnerPrompt] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");

  const close = () => {
    setIsOpen(false);
    setShowOwnerPrompt(false);
    setNewOwnerId("");
  };

  const candidateOwners = members.filter((entry) => entry.id !== member.id);

  const handleMakeOwner = async () => {
    setIsSubmitting(true);
    try {
      await onChangeOwner(member.id);
      setFeedback({ type: "success", message: `${member.username} is now the group owner.` });
      close();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to change owner",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    setIsSubmitting(true);
    try {
      await onRemove(member.id);
      setFeedback({ type: "success", message: `${member.username} removed from group.` });
      close();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to remove member",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOwner = async () => {
    if (!newOwnerId) {
      setFeedback({ type: "error", message: "Select a new owner first." });
      return;
    }

    setIsSubmitting(true);
    try {
      await onRemove(member.id, Number(newOwnerId));
      setFeedback({ type: "success", message: "Owner removed and reassigned." });
      close();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to remove owner",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = member.groupRole === "OWNER";

  return (
    <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="px-1 py-1 text-slate-400 hover:text-cyan-100"
      >
        <Ellipsis className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          className={`absolute right-0 z-20 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 shadow-xl shadow-slate-950/60 ${
            showOwnerPrompt ? "w-64" : "w-56"
          } ${index < 2 ? "top-9" : "bottom-9"}`}
        >
          {!isOwner && (
            <button
              type="button"
              onClick={() => void handleMakeOwner()}
              disabled={isSubmitting}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-amber-200 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Crown className="h-4 w-4 text-amber-300" />
              Make Owner
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isOwner) {
                setShowOwnerPrompt(true);
              } else {
                void handleRemoveMember();
              }
            }}
            disabled={isSubmitting}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4 text-rose-300" />
            {isOwner ? "Remove Owner" : "Remove Member"}
          </button>

          {showOwnerPrompt && (
            <div className="mt-2 rounded-md border border-slate-800 bg-slate-900/60 p-2">
              <p className="mb-2 text-xs text-slate-400">Select replacement owner</p>
              <select
                value={newOwnerId}
                onChange={(event) => setNewOwnerId(event.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                disabled={isSubmitting}
              >
                <option value="">Choose member</option>
                {candidateOwners.map((entry) => (
                  <option key={entry.id} value={String(entry.id)}>
                    {entry.username}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={close}
                  className="flex-1 text-xs"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleRemoveOwner()}
                  className="flex-1 text-xs"
                  disabled={isSubmitting || !newOwnerId}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
