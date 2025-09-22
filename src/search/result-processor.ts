import type { JMDictEntry, ConversionResult } from '../types.js';
import { JapaneseConverter } from '../utils/japanese-converter.js';

/**
 * Processes dictionary entries into conversion results
 */
export class ResultProcessor {
  /**
   * Convert a dictionary entry to conversion results
   */
  static entryToConversions(entry: JMDictEntry): ConversionResult[] {
    const results: ConversionResult[] = [];

    // Get all katakana readings, sorted by commonality
    const katakanaReadings = entry.kana
      .filter(kana => JapaneseConverter.isKatakana(kana.text))
      .sort((a, b) => {
        if (a.common && !b.common) return -1;
        if (!a.common && b.common) return 1;
        return 0;
      });

    // Extract meaning from first sense
    const meaning = this.extractMeaning(entry);

    for (const kana of katakanaReadings) {
      const correspondingKanji = this.findCorrespondingKanji(entry, kana);

      results.push({
        katakana: kana.text,
        hiragana: JapaneseConverter.katakanaToHiragana(kana.text),
        kanji: correspondingKanji?.text,
        romaji: JapaneseConverter.katakanaToRomaji(kana.text),
        meaning,
        common: kana.common || false
      });
    }

    return results;
  }

  /**
   * Remove duplicate results based on katakana text
   */
  static deduplicateResults(results: ConversionResult[]): ConversionResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.katakana;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort results by relevance (common words first)
   */
  static sortByRelevance(results: ConversionResult[]): ConversionResult[] {
    return results.sort((a, b) => {
      if (a.common && !b.common) return -1;
      if (!a.common && b.common) return 1;
      return 0;
    });
  }

  private static extractMeaning(entry: JMDictEntry): string {
    return entry.sense[0]?.gloss
      .filter(g => g.lang === 'eng' || !g.lang)
      .map(g => g.text)
      .join(', ') || '';
  }

  private static findCorrespondingKanji(entry: JMDictEntry, kana: any) {
    return entry.kanji?.find(k =>
      !kana.appliesToKanji || kana.appliesToKanji.includes(k.text)
    );
  }
}