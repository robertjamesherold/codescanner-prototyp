/* ============================================================================
   THEME STORE — single source of truth for light/dark
   ----------------------------------------------------------------------------
   The user's choice is one of three preferences:

     'system' (default) → follow the OS `prefers-color-scheme`
     'light' / 'dark'   → an explicit override, persisted in localStorage

   The active preference is reflected on <html data-theme="…"> (removed for
   'system'). tokens.css keys its color tokens off that attribute + the media
   query, so colors switch instantly. Anything JS-driven (themed images, the
   prototype embed, the token swatches) reads `getIsDark()` so it switches in
   lockstep — including when the user manually overrides against the OS setting.

   A tiny inline script in index.html applies the saved attribute before first
   paint to avoid a flash; this module then takes over at runtime.
   ========================================================================== */

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const readPreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* localStorage unavailable (private mode, etc.) — fall back to system */
  }
  return 'system';
};

let preference: ThemePreference = readPreference();
let isDark: boolean = preference === 'system' ? systemPrefersDark() : preference === 'dark';

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Reflect the current preference onto <html> (or clear it for 'system'). */
const applyToDocument = () => {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (preference === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', preference);
};

const recompute = () => {
  isDark = preference === 'system' ? systemPrefersDark() : preference === 'dark';
};

const setPreference = (next: ThemePreference) => {
  preference = next;
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore persistence failures */
  }
  applyToDocument();
  recompute();
  emit();
};

/** Flip to an explicit override that is the opposite of what's shown now. */
const toggle = () => setPreference(isDark ? 'light' : 'dark');

if (typeof window !== 'undefined') {
  // Keep in sync with the OS while we're following it.
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (preference !== 'system') return;
      recompute();
      emit();
    });

  // Make sure the attribute matches the stored preference even if the inline
  // bootstrap in index.html didn't run.
  applyToDocument();
}

export const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getIsDark: () => isDark,
  getPreference: () => preference,
  setPreference,
  toggle,
};
