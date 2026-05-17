import { Moon, Sun } from "lucide-react";
import { Switch } from "../../../components/ui/switch";
import { cn } from "../../../lib/utils";
import { useTheme } from "../../../lib/theme-provider";

export function ThemeModeToggle() {
  const { isDark, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <p className="text-sm text-slate-400">Theme mode toggle</p>
        <p className="mt-1 text-xs text-slate-500">Session-only preference stored in a cookie.</p>
      </div>
      <div className="flex items-center gap-3">
        <Sun className={cn("h-4 w-4 transition-colors", isDark ? "text-slate-500" : "text-amber-300")} />
        <Switch
          id="theme-mode-toggle"
          checked={isDark}
          onChange={(checked) => setTheme(checked ? "dark" : "light")}
          ariaLabel="Toggle between light and dark theme"
        />
        <Moon className={cn("h-4 w-4 transition-colors", isDark ? "text-cyan-300" : "text-slate-500")} />
      </div>
    </div>
  );
}
