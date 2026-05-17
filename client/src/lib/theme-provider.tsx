import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_COOKIE_NAME = "pb138_theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readThemeCookie(): Theme | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!cookieValue) {
    return null;
  }

  const decodedValue = decodeURIComponent(cookieValue);
  return decodedValue === "light" || decodedValue === "dark" ? decodedValue : null;
}

function writeThemeCookie(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; Path=/; SameSite=Lax`;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readThemeCookie() ?? "dark");

  useLayoutEffect(() => {
    applyTheme(theme);
    writeThemeCookie(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: (nextTheme) => setThemeState(nextTheme),
      toggleTheme: () => setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
