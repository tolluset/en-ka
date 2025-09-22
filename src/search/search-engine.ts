import fuzzy from 'fuzzy';
import type { IndexedDictionary } from '../types.js';

/**
 * Search engine for dictionary lookups
 */
export class SearchEngine {
  constructor(private dictionary: IndexedDictionary) {}

  /**
   * Find direct matches for a query
   */
  findDirectMatches(query: string): string[] {
    const entries = this.dictionary.englishToJapanese.get(query.toLowerCase()) || [];
    return entries.map(entry => entry.id);
  }

  /**
   * Find fuzzy matches for a query
   */
  findFuzzyMatches(query: string, maxResults = 5): string[] {
    const allKeys = Array.from(this.dictionary.englishToJapanese.keys());
    const fuzzyResults = fuzzy.filter(query.toLowerCase(), allKeys);

    const entryIds: string[] = [];

    for (const fuzzyResult of fuzzyResults.slice(0, maxResults)) {
      const entries = this.dictionary.englishToJapanese.get(fuzzyResult.original) || [];
      entryIds.push(...entries.map(entry => entry.id));
    }

    return entryIds;
  }

  /**
   * Get word suggestions based on partial input
   */
  getSuggestions(partialQuery: string, maxResults = 10): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions: string[] = [];

    for (const key of this.dictionary.englishToJapanese.keys()) {
      if (key.startsWith(query) && suggestions.length < maxResults) {
        suggestions.push(key);
      }
    }

    return suggestions;
  }
}