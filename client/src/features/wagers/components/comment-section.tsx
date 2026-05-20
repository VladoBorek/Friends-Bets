import { useCallback, useEffect, useRef, useState } from "react";
import {
  paginatedWagerCommentsResponseSchema,
  wagerCommentResponseSchema,
} from "@pb138/shared/schemas/wager";
import { readJsonOrThrow } from "../../../api/http";
import { Button } from "../../../components/ui/button";
import { Card, CardTitle } from "../../../components/ui/card";
import { Textarea } from "../../../components/ui/textarea";

const COMMENTS_BATCH_SIZE = 10;
const LOAD_MORE_THRESHOLD_PX = 160;

type WagerComment = { id: number; userId: number; username: string; content: string; createdAt: string };
type PaginationState = { total: number; limit: number; offset: number; hasMore: boolean };

interface CommentSectionProps {
  wagerId: number;
  currentUserId: number | undefined;
  isCommentingRestricted?: boolean;
  commentRestrictionMessage?: string;
}

export function CommentSection({
  wagerId,
  currentUserId,
  isCommentingRestricted = false,
  commentRestrictionMessage,
}: CommentSectionProps) {
  const [comments, setComments] = useState<WagerComment[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldScrollAfterLoadRef = useRef(false);

  const isAuthenticated = Boolean(currentUserId);
  const isSubmissionRestricted = isAuthenticated && isCommentingRestricted;

  const loadComments = useCallback(async (offset: number, mode: "replace" | "append") => {
    if (mode === "append") setIsLoadingMore(true);
    else setIsInitialLoading(true);

    try {
      setLoadError(null);

      const params = new URLSearchParams({
        limit: String(COMMENTS_BATCH_SIZE),
        offset: String(offset),
      });

      const response = await fetch(`/api/wagers/${wagerId}/comments?${params.toString()}`, {
        credentials: "same-origin",
      });

      const json = paginatedWagerCommentsResponseSchema.parse(
        await readJsonOrThrow(response, "Unable to load comments"),
      );

      setComments((current) => {
        if (mode === "replace") return json.data;

        const seen = new Set(current.map((comment) => comment.id));
        return [...current, ...json.data.filter((comment) => !seen.has(comment.id))];
      });
      setPagination(json.pagination);

      if (shouldScrollAfterLoadRef.current) {
        shouldScrollAfterLoadRef.current = false;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (error) {
      if (mode === "replace") {
        setComments([]);
        setPagination(null);
      }

      setLoadError(error instanceof Error ? error.message : "Unable to load comments");
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [wagerId]);

  useEffect(() => {
    void loadComments(0, "replace");
  }, [loadComments, reloadKey]);

  const hasMore = pagination?.hasMore ?? false;
  const totalComments = pagination?.total ?? comments.length;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isInitialLoading || isLoadingMore) return;

    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
      void loadComments(comments.length, "append");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmissionRestricted) {
      setSubmitError(commentRestrictionMessage ?? "Commenting is disabled for your account.");
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/wagers/${wagerId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content: trimmed }),
      });

      wagerCommentResponseSchema.parse(
        await readJsonOrThrow(response, "Failed to post comment"),
      );

      setDraft("");
      shouldScrollAfterLoadRef.current = true;
      setReloadKey((key) => key + 1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Comments</CardTitle>
        {!isInitialLoading && totalComments > 0 && (
          <span className="text-sm text-slate-500">{totalComments}</span>
        )}
      </div>

      <div
        onScroll={handleScroll}
        className="mt-4 max-h-96 overflow-y-auto pr-2"
      >
        <div className="grid gap-2">
          {isInitialLoading && <p className="text-sm text-slate-500">Loading comments...</p>}
          {loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          {!isInitialLoading && !loadError && comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet. Be the first!</p>
          )}
          {!isInitialLoading && !loadError && comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-medium ${comment.userId === currentUserId ? "text-cyan-300" : "text-slate-200"}`}>
                  {comment.username}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{comment.content}</p>
            </div>
          ))}
          {isLoadingMore && (
            <p className="py-2 text-center text-xs text-slate-500">Loading more comments...</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {isAuthenticated ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-2">
          {isSubmissionRestricted && (
            <div className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {commentRestrictionMessage ?? "Commenting is disabled for your account."}
            </div>
          )}
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            disabled={isSubmitting || isSubmissionRestricted}
          />
          {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isSubmissionRestricted || !draft.trim()}
              className="w-fit"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Sign in to leave a comment.</p>
      )}
    </Card>
  );
}