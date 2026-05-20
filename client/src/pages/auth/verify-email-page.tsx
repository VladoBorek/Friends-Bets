import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { readJsonOrThrow } from "../../api/http";
import { useAuth } from "../../lib/auth-context";
import { AuthLayout } from "../../components/layout/auth-layout";
import { Button } from "../../components/ui/button";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/verify-email" });
  const { refreshUser } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const run = async () => {
      const token = search.token;

      if (!token || typeof token !== "string") {
        setState("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await fetch("/api/users/verify-email", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        await readJsonOrThrow(res, "Verification failed.");

        await refreshUser();
        setState("success");
        setMessage("Your email has been verified.");

        window.setTimeout(() => {
          void navigate({ to: "/", search: { verified: "1" } });
        }, 1600);
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      }
    };

    void run();
  }, [navigate, refreshUser, search.token]);

  const Icon = state === "loading" ? Loader2 : state === "success" ? CheckCircle2 : ShieldAlert;

  return (
    <AuthLayout
      title="Email Verification"
      description={message}
      icon={Icon}
      error={state === "error" ? message : null}
      success={state === "success" ? message : null}
    >
      <div className="flex flex-col items-center gap-4">
        {state === "loading" && <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />}

        {state === "success" && (
          <p className="text-center text-sm text-slate-400">Redirecting you to Dashboard...</p>
        )}

        {state !== "loading" && (
          <Button
            variant="secondary"
            onClick={() => void navigate({ to: "/auth/login" })}
            className="mt-4 w-full"
          >
            Go to Login
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}