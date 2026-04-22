import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { createWagerRequestSchema, type CategorySummary } from "../../../../../shared/src/schemas/wager";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import { useAuth } from "../../../lib/auth-context";
import { toErrorMessage } from "../utils";
import { UserSearchSection, type UserSearchResult } from "./user-search-section";

const MAX_OUTCOMES = 8;
const MIN_OUTCOMES = 2;

interface CreateWagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateWagerModal({ open, onOpenChange, onCreated }: CreateWagerModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>(["Yes", "No"]);
  const [isPublic, setIsPublic] = useState(true);
  const [invitedUsers, setInvitedUsers] = useState<UserSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setIsLoadingCategories(true);
    async function loadCategories() {
      try {
        const response = await fetch("/api/wagers/categories", { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: CategorySummary[]; message?: string } | null;
        if (!response.ok) throw new Error(json?.message ?? "Unable to load categories");
        const loaded = json?.data ?? [];
        setCategories(loaded);
        if (loaded.length > 0) setSelectedCategoryId(String(loaded[0].id));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(toErrorMessage(error));
      } finally {
        setIsLoadingCategories(false);
      }
    }
    void loadCategories();
    return () => controller.abort();
  }, [open]);

  function updateOutcome(index: number, value: string) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? value : o)));
  }
  function addOutcome() {
    if (outcomes.length < MAX_OUTCOMES) setOutcomes((prev) => [...prev, ""]);
  }
  function removeOutcome(index: number) {
    if (outcomes.length > MIN_OUTCOMES) setOutcomes((prev) => prev.filter((_, i) => i !== index));
  }
  function addInvitedUser(u: UserSearchResult) {
    setInvitedUsers((prev) => (prev.some((x) => x.id === u.id) ? prev : [...prev, u]));
  }
  function removeInvitedUser(id: number) {
    setInvitedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    if (isSuspended) { setErrorMessage("Suspended users cannot create wagers."); return; }
    if (isUnverified) { setErrorMessage("Account must be verified to perform this action."); return; }

    const parsed = createWagerRequestSchema.safeParse({
      title,
      description: description || undefined,
      categoryId: Number(selectedCategoryId),
      isPublic,
      outcomes: outcomes.map((o) => ({ title: o })),
      invitedUserIds: isPublic ? undefined : invitedUsers.map((u) => u.id),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wagers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as { data?: { id?: number }; message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Unable to create wager");
      onCreated();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b border-slate-800 px-6 py-4">
          <DialogTitle>Create Wager</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 px-6 py-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-title">Title</label>
            <Input id="modal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-description">Description</label>
            <Textarea
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-category">Category</label>
            <select
              id="modal-category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={isLoadingCategories || categories.length === 0}
              className="rounded border border-slate-700 bg-slate-800 p-2 text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">
              Outcomes <span className="text-slate-500">({outcomes.length}/{MAX_OUTCOMES})</span>
            </label>
            <div className="grid gap-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={outcome}
                    onChange={(e) => updateOutcome(index, e.target.value)}
                    placeholder={`Outcome ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    disabled={outcomes.length <= MIN_OUTCOMES}
                    className="rounded border border-slate-700 px-3 text-slate-400 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove outcome"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {outcomes.length < MAX_OUTCOMES && (
              <button type="button" onClick={addOutcome} className="mt-1 w-fit text-sm text-slate-400 hover:text-white">
                + Add outcome
              </button>
            )}
          </div>

          <Switch
            id="modal-isPublic"
            checked={isPublic}
            onChange={(checked) => { setIsPublic(checked); if (checked) setInvitedUsers([]); }}
            label={isPublic ? "Public — visible to everyone" : "Private — visible only to you and invited users"}
          />

          {!isPublic && (
            <UserSearchSection invitedUsers={invitedUsers} onAdd={addInvitedUser} onRemove={removeInvitedUser} />
          )}

          {isSuspended && <p className="text-sm text-amber-200">Suspended users cannot create wagers.</p>}
          {isUnverified && <p className="text-sm text-amber-200">Account must be verified to perform this action.</p>}
          {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSuspended || isUnverified || isLoadingCategories || categories.length === 0}
              className="flex-1"
            >
              {isSubmitting ? "Creating…" : "Create Wager"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
