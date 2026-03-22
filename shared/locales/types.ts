import type { CVSection } from '../types';

export type SectionType = Exclude<CVSection['type'], 'heading' | 'paragraph' | 'list'>;

/**
 * Maps each structured section type to a list of lowercase keyword substrings.
 * A heading matches a type if any keyword is a substring of the lowercased title.
 */
export type SectionKeywordMap = Record<SectionType, string[]>;
