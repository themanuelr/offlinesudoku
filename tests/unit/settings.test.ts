import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../../src/game/settings';

describe('normalizeSettings', () => {
  it('fills defaults', () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
  it('rejects unknown values', () => {
    expect(normalizeSettings({ theme: 'pink', language: 'fr' })).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid values', () => {
    expect(normalizeSettings({ theme: 'dark', language: 'es' })).toMatchObject({ theme: 'dark', language: 'es' });
  });
});
