import { en, type Strings } from './en';
import { es } from './es';
import { settings, type Language } from '../game/settings';
import { useStore } from '../game/store';

const LANGS = { en, es } as const;
export type Lang = keyof typeof LANGS;

export function resolveLang(pref: Language, deviceLangs: readonly string[] = navigator.languages ?? [navigator.language]): Lang {
  if (pref !== 'auto') return pref;
  for (const l of deviceLangs) {
    const code = l.toLowerCase().split('-')[0];
    if (code in LANGS) return code as Lang;
  }
  return 'en';
}

export function useT(): Strings {
  const { language } = useStore(settings);
  const lang = resolveLang(language);
  document.documentElement.lang = lang;
  return LANGS[lang];
}

export type { Strings };
