export const themePreferences = ["light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];

const STORAGE_KEY = "stashed-theme";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    themePreferences.some((preference) => preference === value)
  );
}

function getSystemTheme(): ThemePreference {
  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function getThemePreference(): ThemePreference {
  try {
    const preference = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(preference) ? preference : getSystemTheme();
  } catch {
    return getSystemTheme();
  }
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = preference;
  root.dataset.themePreference = preference;

  const favicon = document.querySelector<HTMLLinkElement>("#favicon");
  favicon?.setAttribute("href", `/favicon-${preference}.png`);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The active page still follows the choice when storage is unavailable.
  }

  applyThemePreference(preference);
}

export function initializeTheme() {
  applyThemePreference(getThemePreference());
}
