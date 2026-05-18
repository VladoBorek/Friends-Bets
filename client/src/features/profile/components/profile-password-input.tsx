import type { ChangeEventHandler } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../../components/ui/utils/input";

interface ProfilePasswordInputProps {
  id: string;
  value: string;
  isRevealed: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onFocus?: () => void;
  onToggleReveal: () => void;
  autoComplete?: string;
  minLength?: number;
  readOnly?: boolean;
  required?: boolean;
}

export function ProfilePasswordInput({
  id,
  value,
  isRevealed,
  onChange,
  onFocus,
  onToggleReveal,
  autoComplete,
  minLength,
  readOnly,
  required,
}: ProfilePasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={isRevealed ? "text" : "password"}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        autoComplete={autoComplete}
        minLength={minLength}
        className="pr-11"
        readOnly={readOnly}
        required={required}
      />
      <button
        type="button"
        onClick={onToggleReveal}
        className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
        aria-label={isRevealed ? "hide password" : "show password"}
      >
        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
