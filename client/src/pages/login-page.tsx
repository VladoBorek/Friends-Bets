import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/utils/button";
import { Input } from "../components/ui/utils/input";
import { AuthLayout } from "../components/layout/auth-layout";
import { FormItem } from "../components/ui/utils/form-item";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials");
      }

      await refreshUser();
      await navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="System Access"
      description="Enter your credentials to continue"
      icon={LogIn}
      error={error}
    >
      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
        <FormItem label="Email Address" htmlFor="login-email">
          <Input
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@pb138.net"
            autoComplete="username email"
            required
          />
        </FormItem>

        <FormItem label="Password" htmlFor="login-password">
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
              placeholder="••••••••"
              autoComplete="current-password"
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Authenticating..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void navigate({ to: "/register" })}
          className="w-full"
        >
          Create Account
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate({ to: "/reset-password" })}
          className="w-full text-slate-400 hover:text-cyan-200"
        >
          Forgot Password?
        </Button>
      </div>
    </AuthLayout>
  );
}
