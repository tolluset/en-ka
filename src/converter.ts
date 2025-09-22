import type { ConversionResult, SearchOptions, IndexedDictionary } from './types.js';
import { DictionaryLoader } from './dictionary/loader.js';
import { SearchEngine } from './search/search-engine.js';
import { ResultProcessor } from './search/result-processor.js';

/**
 * Main converter class for English to Katakana conversion
 */
export class EnglishToKatakanaConverter {
  private loader: DictionaryLoader;
  private dictionary: IndexedDictionary | null = null;
  private searchEngine: SearchEngine | null = null;

  constructor() {
    this.loader = new DictionaryLoader();
  }

  /**
   * Initialize the converter with dictionary data
   */
  async initialize(): Promise<void> {
    this.dictionary = await this.loader.loadDictionary();
    this.searchEngine = new SearchEngine(this.dictionary);
  }

  /**
   * Convert English text to Katakana with various options
   */
  async convert(englishText: string, options: SearchOptions = {}): Promise<ConversionResult[]> {
    await this.ensureInitialized();

    const { fuzzy: useFuzzy = false, maxResults = 10 } = options;
    const query = englishText.toLowerCase().trim();

    let entryIds: string[] = [];

    // Try direct match first
    entryIds = this.searchEngine!.findDirectMatches(query);

    // Fall back to fuzzy search if no direct matches and fuzzy is enabled
    if (entryIds.length === 0 && useFuzzy) {
      entryIds = this.searchEngine!.findFuzzyMatches(query);
    }

    // Convert entry IDs to conversion results
    const results = this.processEntryIds(entryIds);

    // Sort and limit results
    const sortedResults = ResultProcessor.sortByRelevance(results);
    return sortedResults.slice(0, maxResults);
  }

  /**
   * Get word suggestions based on partial input
   */
  async searchSuggestions(partialQuery: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.searchEngine!.getSuggestions(partialQuery);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.dictionary || !this.searchEngine) {
      await this.initialize();
    }
  }

  private processEntryIds(entryIds: string[]): ConversionResult[] {
    const results: ConversionResult[] = [];

    for (const entryId of entryIds) {
      const entry = this.dictionary!.entries.get(entryId);
      if (entry) {
        const conversions = ResultProcessor.entryToConversions(entry);
        results.push(...conversions);
      }
    }

    return ResultProcessor.deduplicateResults(results);
  }
}