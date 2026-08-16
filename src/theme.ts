export const themePreferences = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const STORAGE_KEY = "stashed-theme";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    themePreferences.some((preference) => preference === value)
  );
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function getThemePreference(): ThemePreference {
  try {
    const preference = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(preference) ? preference : "system";
  } catch {
    return "system";
  }
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(preference);
  root.dataset.themePreference = preference;
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
  const systemPreference = window.matchMedia(DARK_MODE_QUERY);

  applyThemePreference(getThemePreference());
  systemPreference.addEventListener("change", () => {
    const preference = getThemePreference();
    if (preference === "system") {
      applyThemePreference(preference);
    }
  });
}
