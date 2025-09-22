import type { JMDictEntry, ConversionResult, ScoredResult } from '../types.js';
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
   * Process scored results into conversion results with proper sorting
   */
  static processScoredResults(scoredResults: ScoredResult[]): ConversionResult[] {
    // Sort by score first, then by commonality
    const sortedScored = scoredResults.sort((a, b) => {
      // Primary sort: by score
      if (a.score !== b.score) return b.score - a.score;

      // Secondary sort: by commonality (common entries first)
      const aCommon = a.entry.kana.some(k => k.common) || false;
      const bCommon = b.entry.kana.some(k => k.common) || false;
      if (aCommon && !bCommon) return -1;
      if (!aCommon && bCommon) return 1;

      // Tertiary sort: alphabetically by first katakana reading
      const aKatakana = a.entry.kana.find(k => this.isKatakana(k.text))?.text || '';
      const bKatakana = b.entry.kana.find(k => this.isKatakana(k.text))?.text || '';
      return aKatakana.localeCompare(bKatakana);
    });

    const results: ConversionResult[] = [];
    for (const scoredResult of sortedScored) {
      const conversions = this.entryToConversions(scoredResult.entry);
      results.push(...conversions);
    }

    return this.deduplicateResults(results);
  }

  /**
   * Sort results by relevance (common words first) - legacy method
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

  private static isKatakana(text: string): boolean {
    return /^[\u30A0-\u30FF\u30FC\u3099\u309A]+$/.test(text);
  }
}