// client/src/features/friends/components/friends-page-error-state.tsx
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

type FriendsPageErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function FriendsPageErrorState({ message, onRetry }: FriendsPageErrorStateProps) {
  return (
    <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-6">
      <h2 className="text-lg font-semibold text-rose-200">Unable to load friends</h2>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
