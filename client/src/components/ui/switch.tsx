import { cn } from "../../lib/utils";

type SwitchProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
};

export function Switch({ id, checked, onChange, label, ariaLabel }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel ?? label}
          role="switch"
          aria-checked={checked}
          className="sr-only"
        />
        <div
          className={cn(
            "h-6 w-11 rounded-full border transition-colors",
            checked
              ? "border-cyan-400/35 bg-cyan-500"
              : "border-slate-700 bg-slate-700",
          )}
        />
        <div
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
