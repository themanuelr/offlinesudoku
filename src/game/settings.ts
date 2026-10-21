import { createStore } from './store';
import { load, save } from './storage';
import type { ErrorMode } from './game';

export type Theme = 'system' | 'light' | 'dark';
export type Language = 'auto' | 'en' | 'es';
export const ACCENTS = ['blue', 'orange', 'rose', 'green', 'lavender'] as const;
export type Accent = (typeof ACCENTS)[number];

export interface Settings {
  theme: Theme;
  accent: Accent;
  language: Language;
  errorMode: ErrorMode;
  showTimer: boolean;
  showMistakes: boolean;
  hints: boolean;
  autoNotes: boolean;
  vibrate: boolean;
}

export const SETTINGS_KEY = 'sudoku.settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: 'blue',
  language: 'auto',
  errorMode: 'immediate',
  showTimer: true,
  showMistakes: false,
  hints: false,
  autoNotes: false,
  vibrate: false,
};

export function normalizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(typeof raw === 'object' && raw ? raw : {}) } as Settings;
  if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = DEFAULT_SETTINGS.theme;
  if (!ACCENTS.includes(s.accent)) s.accent = DEFAULT_SETTINGS.accent;
  if (!['auto', 'en', 'es'].includes(s.language)) s.language = DEFAULT_SETTINGS.language;
  for (const k of ['showTimer', 'showMistakes', 'hints', 'autoNotes', 'vibrate'] as const) if (typeof s[k] !== 'boolean') s[k] = DEFAULT_SETTINGS[k];
  if (!['immediate', 'conflicts', 'off'].includes(s.errorMode)) s.errorMode = DEFAULT_SETTINGS.errorMode;
  return s;
}

export const settings = createStore<Settings>(normalizeSettings(load(SETTINGS_KEY, {})), (s) => {
  save(SETTINGS_KEY, s);
  applyTheme(s.theme);
  applyAccent(s.accent);
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

export function applyAccent(accent: Accent): void {
  const root = document.documentElement;
  if (accent === 'blue') delete root.dataset.accent;
  else root.dataset.accent = accent;
}
