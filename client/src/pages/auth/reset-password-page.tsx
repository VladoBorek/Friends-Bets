import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { userActionResponseSchema } from "@pb138/shared/schemas/user";
import { readJsonOrThrow } from "../../api/http";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthLayout } from "../../components/layout/auth-layout";
import { FormItem } from "../../components/ui/form-item";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/reset-password" });
  const token = search.token;

  const [email, setEmail] = useState(() => search.email ?? "");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/request-password-reset", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = userActionResponseSchema.parse(
        await readJsonOrThrow(res, "Failed to request reset."),
      );

      setSuccess(json.data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to request reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = userActionResponseSchema.parse(
        await readJsonOrThrow(res, "Password reset failed."),
      );

      setSuccess(json.data.message);
      await navigate({ to: "/auth/login", replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Forgot Password?"
        description="Enter your email to receive a reset link"
        icon={Mail}
        error={error}
        success={success}
      >
        <form onSubmit={handleRequestReset} className="space-y-6">
          <FormItem label="Email Address" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@pb138.net"
              required
            />
          </FormItem>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate({ to: "/auth/login" })}
          className="mt-4 w-full text-slate-400 hover:text-cyan-200"
        >
          Back to Login
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set New Password"
      description="Choose your new security credentials"
      icon={KeyRound}
      error={error}
      success={success}
    >
      <form onSubmit={handleSetNewPassword} className="space-y-6">
        <FormItem label="New Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormItem>

        <FormItem label="Repeat Password" htmlFor="repeatPassword">
          <div className="relative">
            <Input
              id="repeatPassword"
              type={showRepeatPassword ? "text" : "password"}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
            >
              {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormItem>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Update Password"}
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void navigate({ to: "/auth/login" })}
        className="mt-4 w-full text-slate-400 hover:text-cyan-200"
      >
        Back to Login
      </Button>
    </AuthLayout>
  );
}