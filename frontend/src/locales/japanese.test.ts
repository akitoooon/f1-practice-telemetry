import { dateLocale } from '../hooks/useUnits';
import { resolveAIResponseLanguage, resolveRadioLanguage } from '../utils/chatContext';
import { describe, it, expect } from 'vitest';
import { en, getTranslation, loadLocale } from './index';
import translations from './ja/translations.json';
import retained from './ja/retainedEnglish.json';

const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, string> =>
  Object.fromEntries(Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value as Record<string, unknown>, path));
  }));
const placeholders = (value: string) => [...value.matchAll(/\{\{?(\w+)\}?\}/g)].map(m => m[1]).sort();

describe('Japanese hybrid dictionary review', () => {
  it('uses Japanese dates without changing units and keeps automatic voice in English', () => {
    expect(dateLocale('ja')).toBe('ja-JP');
    expect(resolveAIResponseLanguage('auto', 'ja')).toBe('ja');
    expect(resolveRadioLanguage('auto', 'ja')).toBe('en');
    expect(resolveRadioLanguage('es', 'ja')).toBe('es');
  });
  it('classifies every key explicitly and flags new/changed untranslated English', () => {
    const base = flatten(en);
    expect(Object.keys({ ...retained, ...translations }).sort()).toEqual(Object.keys(base).sort());
    for (const [key, value] of Object.entries(retained)) {
      expect(key in translations, key).toBe(false);
      expect(base[key], key).toBe(value);
    }
    for (const [key, value] of Object.entries(translations)) {
      expect(key in base, key).toBe(true);
      expect(placeholders(value), key).toEqual(placeholders(base[key]));
    }
  });
  it('keeps structure and units, translates prose and interpolates values', async () => {
    await loadLocale('ja');
    expect(getTranslation('ja', 'workspace.nav.dashboard')).toBe('Dashboard');
    expect(getTranslation('ja', 'workspace.bestValidLap')).toBe('Best valid lap');
    expect(getTranslation('ja', 'common.units.kmh')).toBe('km/h');
    expect(getTranslation('ja', 'workspace.noSessionHelp')).toContain('保存');
    expect(getTranslation('ja', 'desktop.update.failed', { error: 'offline' })).toBe('更新できませんでした: offline');
    expect(getTranslation('ja', 'not.a.key')).toBe('not.a.key');
  });
});
