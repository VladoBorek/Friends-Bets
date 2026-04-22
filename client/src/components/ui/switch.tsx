type SwitchProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Switch({ id, checked, onChange, label }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-700"}`} />
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
