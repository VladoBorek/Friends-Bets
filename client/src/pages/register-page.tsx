import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/utils/button";
import { Input } from "../components/ui/utils/input";
import { AuthLayout } from "../components/layout/auth-layout";
import { FormItem } from "../components/ui/utils/form-item";

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        throw new Error(data?.message ?? "Registration failed.");
      }

      await refreshUser();
      setSuccess("Account created. You are now signed in. Please verify your email.");
      window.setTimeout(() => {
        void navigate({ to: "/" });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Register now. Verification email will be sent."
      icon={UserPlus}
      error={error}
      success={success}
    >
      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <FormItem label="Username" htmlFor="register-username">
          <Input
            id="register-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-name"
            minLength={3}
            autoComplete="username"
            required
          />
        </FormItem>

        <FormItem label="Email Address" htmlFor="register-email">
          <Input
            id="register-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </FormItem>

        <FormItem label="Password" htmlFor="register-password">
          <div className="relative">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
              placeholder="••••••••"
              minLength={4}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
              aria-label={showPassword ? "hide password" : "show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormItem>

        <FormItem label="Repeat Password" htmlFor="register-repeat-password">
          <div className="relative">
            <Input
              id="register-repeat-password"
              name="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="pr-11"
              placeholder="••••••••"
              minLength={4}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
              aria-label={showRepeatPassword ? "hide password" : "show password"}
            >
              {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormItem>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Register"}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={() => void navigate({ to: "/login" })}
        className="mt-4 w-full text-slate-400 hover:text-cyan-200"
      >
        Back to Login
      </Button>
    </AuthLayout>
  );
}
