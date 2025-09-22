export interface KanjiElement {
  text: string;
  common?: boolean;
  tags?: string[];
  info?: string[];
}

export interface KanaElement {
  text: string;
  common?: boolean;
  tags?: string[];
  info?: string[];
  appliesToKanji?: string[];
}

export interface Gloss {
  text: string;
  lang?: string;
  gender?: string;
  type?: string;
}

export interface Sense {
  partOfSpeech?: string[];
  gloss: Gloss[];
  field?: string[];
  misc?: string[];
  info?: string[];
  languageSource?: Array<{
    lang?: string;
    type?: string;
    wasei?: boolean;
  }>;
  dialect?: string[];
  antonym?: string[];
  see?: string[];
}

export interface JMDictEntry {
  id: string;
  kanji?: KanjiElement[];
  kana: KanaElement[];
  sense: Sense[];
}

export interface ConversionResult {
  katakana: string;
  hiragana?: string;
  kanji?: string;
  romaji?: string;
  meaning: string;
  common: boolean;
}

export type SearchMode = 'strict' | 'normal' | 'broad';

export type MatchType = 'exact' | 'primary' | 'compound' | 'description';

export interface ScoredResult {
  entry: JMDictEntry;
  score: number;  // 0-100
  matchType: MatchType;
  matchedTerm: string;
}

export interface SearchOptions {
  mode?: SearchMode;
  fuzzy?: boolean;
  maxResults?: number;
  verbose?: boolean;
}

export interface IndexedDictionary {
  entries: Map<string, JMDictEntry>;
  exactMatches: Map<string, ScoredResult[]>;      // Exact word matches
  compoundWords: Map<string, ScoredResult[]>;     // Words in compound phrases
  descriptionOnly: Map<string, ScoredResult[]>;   // Words only in descriptions
  katakanaWords: Set<string>;
  lastUpdated: Date;
}