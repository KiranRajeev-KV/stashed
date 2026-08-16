import * as React from "react";
import { Moon, Sun } from "lucide-react";

import {
  getThemePreference,
  setThemePreference,
  themePreferences,
  type ThemePreference,
} from "../../theme.js";

const themeLabels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
};

type ThemeControlProps = {
  variant?: "segmented" | "select" | "toggle";
};

export function ThemeControl({ variant = "segmented" }: ThemeControlProps) {
  const [preference, setPreference] = React.useState<ThemePreference>(() =>
    getThemePreference(),
  );

  React.useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const appliedTheme = root.dataset.theme;

      if (appliedTheme === "light" || appliedTheme === "dark") {
        setPreference(appliedTheme);
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  function chooseTheme(nextPreference: ThemePreference) {
    setThemePreference(nextPreference);
    setPreference(nextPreference);
  }

  if (variant === "toggle") {
    const isDark = preference === "dark";
    const nextTheme = isDark ? "light" : "dark";

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark appearance"
        title={`Switch to ${nextTheme} appearance`}
        onClick={() => chooseTheme(nextTheme)}
        className="inline-grid size-10 shrink-0 place-items-center rounded-full border-0 bg-transparent p-1 text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground"
      >
        <span
          className="grid size-8 place-items-center rounded-full border border-border bg-surface"
          aria-hidden="true"
        >
          {isDark ? (
            <Moon size={16} strokeWidth={1.8} />
          ) : (
            <Sun size={16} strokeWidth={1.8} />
          )}
        </span>
      </button>
    );
  }

  if (variant === "select") {
    return (
      <label className="relative inline-flex min-h-10 items-center">
        <span className="sr-only">Appearance</span>
        <select
          value={preference}
          onChange={(event) =>
            chooseTheme(event.currentTarget.value as ThemePreference)
          }
          className="min-h-10 cursor-pointer rounded-control border border-border bg-surface px-3 pr-8 text-sm font-medium text-foreground"
          aria-label="Appearance"
        >
          {themePreferences.map((theme) => (
            <option key={theme} value={theme}>
              {themeLabels[theme]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <fieldset className="inline-flex rounded-control border border-border bg-surface p-1">
      <legend className="sr-only">Appearance</legend>
      {themePreferences.map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={preference === theme}
          onClick={() => chooseTheme(theme)}
          className="min-h-9 rounded-control px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {themeLabels[theme]}
        </button>
      ))}
    </fieldset>
  );
}
