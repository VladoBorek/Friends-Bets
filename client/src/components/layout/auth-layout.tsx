import type { ReactNode } from "react";
import { Card, CardDescription, CardTitle } from "../ui/card";
import type { LucideIcon } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: LucideIcon;
  error?: string | null;
  success?: string | null;
}

export function AuthLayout({ children, title, description, icon: Icon, error, success }: AuthLayoutProps) {
  return (
    <div key={title} className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 inline-flex rounded-full bg-cyan-950/50 p-3 ring-1 ring-cyan-500/30">
            <Icon className="h-6 w-6 text-cyan-400" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">{title}</CardTitle>
          <CardDescription className="mt-2 text-sm text-slate-400 text-center">
            {description}
          </CardDescription>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
            {success}
          </div>
        )}

        {children}
      </Card>
    </div>
  );
}
