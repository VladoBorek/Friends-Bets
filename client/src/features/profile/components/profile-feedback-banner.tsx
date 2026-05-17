interface ProfileFeedbackState {
  type: "success" | "error";
  message: string;
}

interface ProfileFeedbackBannerProps {
  feedback: ProfileFeedbackState | null;
}

export function ProfileFeedbackBanner({ feedback }: ProfileFeedbackBannerProps) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        feedback.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
      }`}
    >
      {feedback.message}
    </div>
  );
}
