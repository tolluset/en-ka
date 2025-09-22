/**
 * Utility class for Japanese text conversion operations
 */
export class JapaneseConverter {
  private static readonly KATAKANA_TO_ROMAJI_MAP: Record<string, string> = {
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

  private static readonly VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

  /**
   * Check if text contains only katakana characters
   */
  static isKatakana(text: string): boolean {
    // eslint-disable-next-line no-misleading-character-class
    return /^[\u30A0-\u30FF\u30FC\u3099\u309A]+$/.test(text);
  }

  /**
   * Convert katakana to hiragana
   */
  static katakanaToHiragana(katakana: string): string {
    return katakana.replace(/[\u30A1-\u30F6]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0x60);
    });
  }

  /**
   * Convert katakana to romaji with proper handling of special characters
   */
  static katakanaToRomaji(katakana: string): string {
    let romaji = '';

    for (let i = 0; i < katakana.length; i++) {
      const char = katakana[i];
      const mapping = this.KATAKANA_TO_ROMAJI_MAP[char];

      if (!mapping) {
        romaji += char;
        continue;
      }

      // Handle small tsu (っ) - double next consonant
      if (char === 'ッ' && i + 1 < katakana.length) {
        const nextChar = katakana[i + 1];
        const nextRomaji = this.KATAKANA_TO_ROMAJI_MAP[nextChar];

        if (nextRomaji && !this.VOWELS.has(nextRomaji[0])) {
          romaji += nextRomaji[0];
        }
      } else {
        romaji += mapping;
      }
    }

    return romaji;
  }
}