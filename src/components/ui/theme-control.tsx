import * as React from "react";

import {
  getThemePreference,
  setThemePreference,
  themePreferences,
  type ThemePreference,
} from "../../theme.js";

const themeLabels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

type ThemeControlProps = {
  compact?: boolean;
};

export function ThemeControl({ compact = false }: ThemeControlProps) {
  const [preference, setPreference] = React.useState<ThemePreference>(() =>
    getThemePreference(),
  );

  function chooseTheme(nextPreference: ThemePreference) {
    setThemePreference(nextPreference);
    setPreference(nextPreference);
  }

  if (compact) {
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
