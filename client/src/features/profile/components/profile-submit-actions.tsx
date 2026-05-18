import { Button } from "../../../components/ui/utils/button";

interface ProfileSubmitActionsProps {
  isSaving: boolean;
  canSubmit: boolean;
  onCancel: () => void;
}

export function ProfileSubmitActions({ isSaving, canSubmit, onCancel }: ProfileSubmitActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={!canSubmit}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
    </div>
  );
}
