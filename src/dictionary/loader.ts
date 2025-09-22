import { readFileSync } from 'fs';
import { type JMDictEntry, type IndexedDictionary } from '../types.js';
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
    const englishToJapanese = new Map<string, JMDictEntry[]>();
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

      // Index by English meanings
      for (const sense of entry.sense) {
        for (const gloss of sense.gloss) {
          if (gloss.lang === 'eng' || !gloss.lang) {
            const englishText = gloss.text.toLowerCase().trim();

            // Index full phrase
            this.addToIndex(englishToJapanese, englishText, entry);

            // Index individual words
            const words = englishText.split(/[\s,;()[\]]+/)
              .filter(word => word.length > 2 && !this.isCommonWord(word));

            for (const word of words) {
              this.addToIndex(englishToJapanese, word, entry);
            }
          }
        }
      }
    }

    return {
      entries: entriesMap,
      englishToJapanese,
      katakanaWords,
      lastUpdated: new Date()
    };
  }

  private addToIndex(index: Map<string, JMDictEntry[]>, key: string, entry: JMDictEntry): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(entry);
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