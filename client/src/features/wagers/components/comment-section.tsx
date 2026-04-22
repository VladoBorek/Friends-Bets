import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardTitle } from "../../../components/ui/card";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import { Textarea } from "../../../components/ui/textarea";

type WagerComment = { id: number; userId: number; username: string; content: string; createdAt: string };

interface CommentSectionProps {
  wagerId: number;
  currentUserId: number | undefined;
}

export function CommentSection({ wagerId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<WagerComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/wagers/${wagerId}/comments`);
        const json = (await res.json().catch(() => null)) as { data?: WagerComment[] } | null;
        setComments(json?.data ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [wagerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wagers/${wagerId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as { data?: WagerComment; message?: string } | null;
      if (!res.ok) throw new Error(json?.message ?? "Failed to post comment");
      if (json?.data) setComments((prev) => [...prev, json.data!]);
      setDraft("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Comments</CardTitle>
        {!isLoading && comments.length > 0 && (
          <span className="text-sm text-slate-500">{comments.length}</span>
        )}
      </div>

      <ScrollArea className="mt-4 max-h-96">
        <div className="grid gap-2">
          {isLoading && <p className="text-sm text-slate-500">Loading comments…</p>}
          {!isLoading && comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-medium ${c.userId === currentUserId ? "text-cyan-300" : "text-slate-200"}`}>
                  {c.username}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{c.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <ScrollBar />
      </ScrollArea>

      {currentUserId ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
          />
          {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !draft.trim()} className="w-fit">
              {isSubmitting ? "Posting…" : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Sign in to leave a comment.</p>
      )}
    </Card>
  );
}
