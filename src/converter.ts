import type { ConversionResult, SearchOptions, SearchMode, ScoredResult, IndexedDictionary } from './types.js';
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

    const {
      mode = 'strict',
      fuzzy: useFuzzy = false,
      maxResults = 10
    } = options;
    const query = englishText.toLowerCase().trim();

    let scoredResults: ScoredResult[] = [];

    // Try scored matches based on mode
    scoredResults = this.searchEngine!.findScoredMatches(query, mode);

    // Fall back to fuzzy search if no matches and fuzzy is enabled
    if (scoredResults.length === 0 && useFuzzy) {
      scoredResults = this.searchEngine!.findFuzzyMatches(query, mode, maxResults);
    }

    // Process scored results into conversion results with proper sorting
    const results = ResultProcessor.processScoredResults(scoredResults);
    return results.slice(0, maxResults);
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

  // Legacy method - kept for compatibility if needed
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