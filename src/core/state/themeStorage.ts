/**
 * Theme persistence with migration from legacy `wwv-theme` key.
 */

import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from "@/core/grondEnv";

export type ThemeId = "dark" | "light" | "legacy" | "black";

const VALID_THEMES = new Set<ThemeId>(["dark", "light", "legacy", "black"]);

/**
 * Reads stored theme, migrating legacy key once.
 */
export function readStoredTheme(): ThemeId {
    if (typeof window === "undefined") return "black";
    try {
        const current = localStorage.getItem(THEME_STORAGE_KEY);
        if (current && VALID_THEMES.has(current as ThemeId)) {
            return current as ThemeId;
        }
        const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        if (legacy && VALID_THEMES.has(legacy as ThemeId)) {
            localStorage.setItem(THEME_STORAGE_KEY, legacy);
            return legacy as ThemeId;
        }
    } catch {
        /* ignore */
    }
    return "black";
}

/**
 * Persists theme to the Grond storage key.
 */
export function writeStoredTheme(theme: ThemeId): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        /* ignore */
    }
}
