import { createStore } from './store';
import { load, save } from './storage';
import type { ErrorMode } from './game';

export type Theme = 'system' | 'light' | 'dark';
export type Language = 'auto' | 'en' | 'es';

export interface Settings {
  theme: Theme;
  language: Language;
  errorMode: ErrorMode;
  showTimer: boolean;
}

export const SETTINGS_KEY = 'sudoku.settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'auto',
  errorMode: 'immediate',
  showTimer: true,
};

export function normalizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(typeof raw === 'object' && raw ? raw : {}) } as Settings;
  if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = DEFAULT_SETTINGS.theme;
  if (!['auto', 'en', 'es'].includes(s.language)) s.language = DEFAULT_SETTINGS.language;
  if (typeof s.showTimer !== 'boolean') s.showTimer = DEFAULT_SETTINGS.showTimer;
  if (!['immediate', 'conflicts', 'off'].includes(s.errorMode)) s.errorMode = DEFAULT_SETTINGS.errorMode;
  return s;
}

export const settings = createStore<Settings>(normalizeSettings(load(SETTINGS_KEY, {})), (s) => {
  save(SETTINGS_KEY, s);
  applyTheme(s.theme);
});

export function updateSettings(patch: Partial<Settings>): void {
  settings.set((s) => ({ ...s, ...patch }));
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#151517' : '#f7f7f5'));
}
