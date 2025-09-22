import { readFileSync } from 'fs';
import { type JMDictEntry, type IndexedDictionary, type ScoredResult, type MatchType } from '../types.js';
import { downloadJMDict, getJMDictPath, isJMDictAvailable } from './downloader.js';

export class DictionaryLoader {
  private indexedDict: IndexedDictionary | null = null;

  async loadDictionary(): Promise<IndexedDictionary> {
    if (this.indexedDict) {
      return this.indexedDict;
    }

    if (!isJMDictAvailable()) {
      await downloadJMDict();
    }

    console.log('Loading and indexing dictionary...');
    const dictPath = getJMDictPath();
    const rawData = readFileSync(dictPath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    // Handle different JSON structures
    let entries: JMDictEntry[];
    if (Array.isArray(parsedData)) {
      // Simple array format (our sample data)
      entries = parsedData;
    } else if (parsedData.words && Array.isArray(parsedData.words)) {
      // JMDict-simplified format with metadata
      entries = parsedData.words;
    } else {
      throw new Error('Unsupported dictionary format');
    }

    this.indexedDict = this.buildIndex(entries);
    console.log(`Dictionary loaded with ${entries.length} entries`);

    return this.indexedDict;
  }

  private buildIndex(entries: JMDictEntry[]): IndexedDictionary {
    const entriesMap = new Map<string, JMDictEntry>();
    const exactMatches = new Map<string, ScoredResult[]>();
    const compoundWords = new Map<string, ScoredResult[]>();
    const descriptionOnly = new Map<string, ScoredResult[]>();
    const katakanaWords = new Set<string>();

    for (const entry of entries) {
      // Store entry by ID for quick lookup
      entriesMap.set(entry.id, entry);

      // Extract katakana readings
      for (const kana of entry.kana) {
        if (this.isKatakana(kana.text)) {
          katakanaWords.add(kana.text);
        }
      }

      // Index by English meanings with scoring
      for (const sense of entry.sense) {
        for (const gloss of sense.gloss) {
          if (gloss.lang === 'eng' || !gloss.lang) {
            const englishText = gloss.text.toLowerCase().trim();
            this.indexWithScoring(englishText, entry, exactMatches, compoundWords, descriptionOnly);
          }
        }
      }
    }

    return {
      entries: entriesMap,
      exactMatches,
      compoundWords,
      descriptionOnly,
      katakanaWords,
      lastUpdated: new Date()
    };
  }

  private indexWithScoring(
    englishText: string,
    entry: JMDictEntry,
    exactMatches: Map<string, ScoredResult[]>,
    compoundWords: Map<string, ScoredResult[]>,
    descriptionOnly: Map<string, ScoredResult[]>
  ): void {
    const words = englishText.split(/[\s,;()[\]]+/).filter(w => w.length > 0);
    const cleanWords = words.filter(word => word.length > 2 && !this.isCommonWord(word));

    if (cleanWords.length === 1) {
      // Single word - add to exact matches with high score
      const word = cleanWords[0];
      const scoredResult: ScoredResult = {
        entry,
        score: 100,
        matchType: 'exact',
        matchedTerm: word
      };
      this.addToScoredIndex(exactMatches, word, scoredResult);
    } else if (cleanWords.length > 1) {
      // Multiple words - compound phrase
      // BUT ALSO index each word individually with appropriate scores

      for (let i = 0; i < cleanWords.length; i++) {
        const word = cleanWords[i];

        if (i === 0) {
          // First word gets higher score (primary meaning)
          const primaryScored: ScoredResult = {
            entry,
            score: 80,
            matchType: 'primary',
            matchedTerm: word
          };
          this.addToScoredIndex(compoundWords, word, primaryScored);
        } else {
          // Other words get lower score (secondary meaning)
          const secondaryScored: ScoredResult = {
            entry,
            score: 60,
            matchType: 'compound',
            matchedTerm: word
          };
          this.addToScoredIndex(compoundWords, word, secondaryScored);
        }
      }
    }

    // Also check if any words might be in descriptions/parentheses
    const descriptionMatch = englishText.match(/\(([^)]+)\)/);
    if (descriptionMatch) {
      const descWords = descriptionMatch[1].split(/[\s,;]+/)
        .filter(word => word.length > 2 && !this.isCommonWord(word));

      for (const word of descWords) {
        const descScored: ScoredResult = {
          entry,
          score: 20,
          matchType: 'description',
          matchedTerm: word
        };
        this.addToScoredIndex(descriptionOnly, word, descScored);
      }
    }
  }

  private addToScoredIndex(index: Map<string, ScoredResult[]>, key: string, scoredResult: ScoredResult): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(scoredResult);
  }

  private isKatakana(text: string): boolean {
    // eslint-disable-next-line no-misleading-character-class
    return /^[\u30A0-\u30FF\u30FC\u3099\u309A]+$/.test(text);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'for', 'with', 'without', 'from', 'to', 'at', 'in', 'on',
      'by', 'of', 'a', 'an', 'be', 'is', 'are', 'was', 'were', 'being', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those'
    ]);
    return commonWords.has(word.toLowerCase());
  }

  getIndexedDictionary(): IndexedDictionary | null {
    return this.indexedDict;
  }
}