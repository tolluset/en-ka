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

export interface SearchOptions {
  fuzzy?: boolean;
  maxResults?: number;
  verbose?: boolean;
}

export interface IndexedDictionary {
  entries: Map<string, JMDictEntry>;
  englishToJapanese: Map<string, JMDictEntry[]>;
  katakanaWords: Set<string>;
  lastUpdated: Date;
}