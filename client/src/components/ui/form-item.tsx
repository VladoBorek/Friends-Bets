import type { ReactNode } from "react";

interface FormItemProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function FormItem({ label, htmlFor, children }: FormItemProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
