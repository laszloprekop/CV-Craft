import type { SectionKeywordMap, SectionType } from './types';
import en from './en.keywords';
import sv from './sv.keywords';

export type { SectionKeywordMap, SectionType };

/** All registered locale keyword maps. Add new locales here. */
const locales: Record<string, SectionKeywordMap> = { en, sv };

/**
 * Returns a merged keyword map combining all registered locales.
 * Optionally restricted to a subset of locales (e.g. from frontmatter `lang`).
 */
export function getMergedKeywords(localeFilter?: string[]): SectionKeywordMap {
  const sources = localeFilter
    ? localeFilter.map(l => locales[l]).filter(Boolean)
    : Object.values(locales);

  const result = {} as SectionKeywordMap;
  for (const map of sources) {
    for (const [type, keywords] of Object.entries(map) as [SectionType, string[]][]) {
      result[type] = [...(result[type] ?? []), ...keywords];
    }
  }
  return result;
}

export { locales };
