import { en } from '../en';
import type { LocaleDictionary } from '../types';
import translations from './translations.json';

/** Structural labels stay English. The explicit retainedEnglish manifest is checked in tests:
 * a new key or changed English label needs review instead of silently becoming untranslated. */
const translated: Record<string, string> = translations;
function hybrid(source: Record<string, unknown>, path = ''): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => {
    const full = path ? `${path}.${key}` : key;
    return [key, typeof value === 'string' ? translated[full] ?? value : hybrid(value as Record<string, unknown>, full)];
  }));
}
export const ja = hybrid(en) as LocaleDictionary;
