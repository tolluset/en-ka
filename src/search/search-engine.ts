import fuzzy from 'fuzzy';
import type { IndexedDictionary, ScoredResult, SearchMode } from '../types.js';

/**
 * Search engine for dictionary lookups
 */
export class SearchEngine {
  constructor(private dictionary: IndexedDictionary) {}

  /**
   * Find scored matches based on search mode
   */
  findScoredMatches(query: string, mode: SearchMode = 'strict'): ScoredResult[] {
    const searchTerm = query.toLowerCase().trim();
    let results: ScoredResult[] = [];

    // Always check exact matches first
    const exactResults = this.dictionary.exactMatches.get(searchTerm) || [];
    results.push(...exactResults);

    // Add compound matches based on mode
    if (mode === 'normal' || mode === 'broad') {
      const compoundResults = this.dictionary.compoundWords.get(searchTerm) || [];
      results.push(...compoundResults);
    }

    // Add description matches only in broad mode
    if (mode === 'broad') {
      const descResults = this.dictionary.descriptionOnly.get(searchTerm) || [];
      results.push(...descResults);
    }

    // Remove duplicates by entry ID, keeping highest score
    const uniqueResults = this.deduplicateByEntry(results);

    return uniqueResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Find fuzzy matches for a query with scoring
   */
  findFuzzyMatches(query: string, mode: SearchMode = 'normal', maxResults = 5): ScoredResult[] {
    // Collect all keys from different indexes based on mode
    const allKeys = new Set<string>();

    // Always include exact match keys
    for (const key of this.dictionary.exactMatches.keys()) {
      allKeys.add(key);
    }

    // Add compound keys if mode allows
    if (mode === 'normal' || mode === 'broad') {
      for (const key of this.dictionary.compoundWords.keys()) {
        allKeys.add(key);
      }
    }

    // Add description keys if broad mode
    if (mode === 'broad') {
      for (const key of this.dictionary.descriptionOnly.keys()) {
        allKeys.add(key);
      }
    }

    const keysArray = Array.from(allKeys);
    const fuzzyResults = fuzzy.filter(query.toLowerCase(), keysArray);

    const scoredResults: ScoredResult[] = [];

    for (const fuzzyResult of fuzzyResults.slice(0, maxResults * 2)) {
      const exactResults = this.dictionary.exactMatches.get(fuzzyResult.original) || [];
      const compoundResults = this.dictionary.compoundWords.get(fuzzyResult.original) || [];
      const descResults = this.dictionary.descriptionOnly.get(fuzzyResult.original) || [];

      // Apply fuzzy penalty (reduce score by 30%)
      const fuzzyPenalty = 0.7;

      exactResults.forEach(result => {
        scoredResults.push({
          ...result,
          score: Math.round(result.score * fuzzyPenalty)
        });
      });

      if (mode === 'normal' || mode === 'broad') {
        compoundResults.forEach(result => {
          scoredResults.push({
            ...result,
            score: Math.round(result.score * fuzzyPenalty)
          });
        });
      }

      if (mode === 'broad') {
        descResults.forEach(result => {
          scoredResults.push({
            ...result,
            score: Math.round(result.score * fuzzyPenalty)
          });
        });
      }
    }

    const uniqueResults = this.deduplicateByEntry(scoredResults);
    return uniqueResults.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  /**
   * Get word suggestions based on partial input
   */
  getSuggestions(partialQuery: string, maxResults = 10): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions: string[] = [];

    // Check exact matches first
    for (const key of this.dictionary.exactMatches.keys()) {
      if (key.startsWith(query) && suggestions.length < maxResults) {
        suggestions.push(key);
      }
    }

    // Then check compound words if we need more suggestions
    if (suggestions.length < maxResults) {
      for (const key of this.dictionary.compoundWords.keys()) {
        if (key.startsWith(query) && !suggestions.includes(key) && suggestions.length < maxResults) {
          suggestions.push(key);
        }
      }
    }

    return suggestions.sort();
  }

  /**
   * Remove duplicates by entry ID, keeping the highest score
   */
  private deduplicateByEntry(results: ScoredResult[]): ScoredResult[] {
    const entryMap = new Map<string, ScoredResult>();

    for (const result of results) {
      const existingResult = entryMap.get(result.entry.id);
      if (!existingResult || result.score > existingResult.score) {
        entryMap.set(result.entry.id, result);
      }
    }

    return Array.from(entryMap.values());
  }
}