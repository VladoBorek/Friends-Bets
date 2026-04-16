import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "../lib/auth-context";
import { Card, CardTitle, CardDescription } from "../components/ui/card";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" });
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { message?: string } | null;
          setState("error");
          setMessage(json?.message ?? "Verification failed.");
          return;
        }

        await refreshUser();
        setState("success");
        setMessage("Your email has been verified.");
        window.setTimeout(() => {
          void navigate({ to: "/", search: { verified: "1" } });
        }, 1600);
      } catch {
        setState("error");
        setMessage("Verification failed.");
      }
    };

    void run();
  }, [navigate, refreshUser, search.token]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-cyan-200">
          {state === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
          {state === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
          {state === "error" && <ShieldAlert className="h-5 w-5 text-rose-300" />}
          <CardTitle className="text-lg font-semibold">Email Verification</CardTitle>
        </div>

        <CardDescription className="text-sm text-slate-300">{message}</CardDescription>

        {state === "success" && (
          <p className="mt-3 text-xs text-slate-400">Redirecting you to Dashboard...</p>
        )}
      </Card>
    </div>
  );
}
