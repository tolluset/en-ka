import fuzzy from 'fuzzy';
import { type JMDictEntry, type ConversionResult, type SearchOptions, type IndexedDictionary } from './types.js';
import { DictionaryLoader } from './dictionary/loader.js';

export class EnglishToKatakanaConverter {
  private loader: DictionaryLoader;
  private dictionary: IndexedDictionary | null = null;

  constructor() {
    this.loader = new DictionaryLoader();
  }

  async initialize(): Promise<void> {
    this.dictionary = await this.loader.loadDictionary();
  }

  async convert(englishText: string, options: SearchOptions = {}): Promise<ConversionResult[]> {
    if (!this.dictionary) {
      await this.initialize();
    }

    const { fuzzy: useFuzzy = false, maxResults = 10 } = options;
    const query = englishText.toLowerCase().trim();

    const results: ConversionResult[] = [];

    // Direct match first
    const directMatches = this.findDirectMatches(query);
    results.push(...directMatches);

    // Fuzzy search if no direct matches and fuzzy is enabled
    if (results.length === 0 && useFuzzy) {
      const fuzzyMatches = this.findFuzzyMatches(query);
      results.push(...fuzzyMatches);
    }

    // Sort by relevance (common words first, then by frequency)
    results.sort((a, b) => {
      if (a.common && !b.common) return -1;
      if (!a.common && b.common) return 1;
      return 0;
    });

    return results.slice(0, maxResults);
  }

  private findDirectMatches(query: string): ConversionResult[] {
    const results: ConversionResult[] = [];
    const entries = this.dictionary!.englishToJapanese.get(query) || [];

    for (const entry of entries) {
      const conversions = this.entryToConversions(entry);
      results.push(...conversions);
    }

    return this.deduplicateResults(results);
  }

  private findFuzzyMatches(query: string): ConversionResult[] {
    const allKeys = Array.from(this.dictionary!.englishToJapanese.keys());
    const fuzzyResults = fuzzy.filter(query, allKeys);

    const results: ConversionResult[] = [];

    for (const fuzzyResult of fuzzyResults.slice(0, 5)) {
      const entries = this.dictionary!.englishToJapanese.get(fuzzyResult.original) || [];
      for (const entry of entries) {
        const conversions = this.entryToConversions(entry);
        results.push(...conversions);
      }
    }

    return this.deduplicateResults(results);
  }

  private entryToConversions(entry: JMDictEntry): ConversionResult[] {
    const results: ConversionResult[] = [];

    // Get all katakana readings
    const katakanaReadings = entry.kana
      .filter(kana => this.isKatakana(kana.text))
      .sort((a, b) => {
        // Sort by common first
        if (a.common && !b.common) return -1;
        if (!a.common && b.common) return 1;
        return 0;
      });

    // Get first sense for meaning
    const meaning = entry.sense[0]?.gloss
      .filter(g => g.lang === 'eng' || !g.lang)
      .map(g => g.text)
      .join(', ') || '';

    for (const kana of katakanaReadings) {
      // Try to get corresponding kanji
      const correspondingKanji = entry.kanji?.find(k =>
        !kana.appliesToKanji || kana.appliesToKanji.includes(k.text)
      );

      results.push({
        katakana: kana.text,
        hiragana: this.katakanaToHiragana(kana.text),
        kanji: correspondingKanji?.text,
        romaji: this.katakanaToRomaji(kana.text),
        meaning,
        common: kana.common || false
      });
    }

    return results;
  }

  private deduplicateResults(results: ConversionResult[]): ConversionResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.katakana;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private isKatakana(text: string): boolean {
    // eslint-disable-next-line no-misleading-character-class
    return /^[\u30A0-\u30FF\u30FC\u3099\u309A]+$/.test(text);
  }

  private katakanaToHiragana(katakana: string): string {
    return katakana.replace(/[\u30A1-\u30F6]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0x60);
    });
  }

  private katakanaToRomaji(katakana: string): string {
    // Basic katakana to romaji mapping
    const mapping: Record<string, string> = {
      'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
      'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
      'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
      'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
      'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
      'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
      'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
      'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
      'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
      'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
      'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
      'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
      'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
      'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
      'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
      'ー': '-', 'ッ': ''
    };

    let romaji = '';
    for (let i = 0; i < katakana.length; i++) {
      const char = katakana[i];
      if (mapping[char]) {
        // Handle small tsu (っ) - double next consonant
        if (char === 'ッ' && i + 1 < katakana.length) {
          const nextChar = katakana[i + 1];
          const nextRomaji = mapping[nextChar];
          if (nextRomaji && nextRomaji[0] !== 'a' && nextRomaji[0] !== 'i' &&
              nextRomaji[0] !== 'u' && nextRomaji[0] !== 'e' && nextRomaji[0] !== 'o') {
            romaji += nextRomaji[0];
          }
        } else {
          romaji += mapping[char];
        }
      } else {
        romaji += char;
      }
    }

    return romaji;
  }

  async searchSuggestions(partialQuery: string): Promise<string[]> {
    if (!this.dictionary) {
      await this.initialize();
    }

    const query = partialQuery.toLowerCase();
    const suggestions: string[] = [];

    for (const key of this.dictionary!.englishToJapanese.keys()) {
      if (key.startsWith(query) && suggestions.length < 10) {
        suggestions.push(key);
      }
    }

    return suggestions;
  }
}