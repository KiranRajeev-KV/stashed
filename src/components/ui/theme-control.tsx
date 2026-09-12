import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Select } from "./select.js";

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
      <Select.Root
        value={preference}
        onValueChange={(value) => {
          if (value) chooseTheme(value);
        }}
      >
        <div className="inline-flex">
          <Select.Label className="sr-only">Appearance</Select.Label>
          <Select.Trigger className="flex min-h-11 items-center gap-3 px-3">
            <Select.Value>{themeLabels[preference]}</Select.Value>
            <Select.Icon>
              <ChevronDown size={14} />
            </Select.Icon>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Positioner
            sideOffset={6}
            alignItemWithTrigger={false}
            className="z-[70] min-w-40 max-w-[calc(100vw-2rem)]"
          >
            <Select.Popup>
              <Select.List className="p-1">
                {themePreferences.map((theme) => (
                  <Select.Item
                    key={theme}
                    value={theme}
                    className="group grid grid-cols-[1rem_1fr] items-center"
                  >
                    {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
                    <Select.ItemText>{themeLabels[theme]}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
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
