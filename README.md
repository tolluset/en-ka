# en-ka (English to Katakana Converter)

A smart CLI tool that converts English words to Japanese Katakana using the comprehensive JMDict dictionary.

## Quick Start

```bash
# Install
pnpm install -g en-ka

# Basic usage
en-ka computer          # → コンピューター [COMMON]
en-ka beer             # → ビール [COMMON], ビア [COMMON]
```

## Features

- 🎯 **Smart search modes** - precise or broad results
- 📊 **Relevance scoring** - intelligent result ranking
- 🔍 **Fuzzy search** - handles typos and partial matches
- 📚 **Rich output** - kanji, hiragana, romaji, and meanings
- ⚡ **Fast local search** - indexed dictionary data
- 💡 **Helpful suggestions** - guides when no results found

## Search Modes

en-ka offers three search modes to match your needs:

### 🎯 Strict Mode (Default)
Only exact word matches
```bash
en-ka mobile           # No results (no exact "mobile" entry)
en-ka computer         # → コンピューター [COMMON]
```

### 🔍 Normal Mode
Includes compound words
```bash
en-ka mobile --mode normal     # → モービルハウス [mobile house], etc.
en-ka beer --mode normal       # → ビール + ビアガーデン [beer garden]
```

### 🌐 Broad Mode
All related terms including descriptions
```bash
en-ka mobile --mode broad      # All mobile-related terms
```

## Smart Suggestions

When no results are found, en-ka suggests what to try next:

```bash
$ en-ka mobile
No results found for "mobile"

Try different search modes:
  en-ka mobile --mode normal   # Include compound words
  en-ka mobile --mode broad    # Include all related terms
  en-ka mobile --fuzzy         # Enable fuzzy matching

Suggestions:
  mob, mobile, mobilisation, mobilise, mobility
```

## Usage Examples

### Basic Searches
```bash
en-ka computer          # → コンピューター
en-ka coffee           # → コーヒー
en-ka programming      # → プログラミング
```

### When You Get No Results
```bash
en-ka mobile           # Try: --mode normal
en-ka smartphone       # Try: --mode normal or --fuzzy
```

### Fuzzy Search for Typos
```bash
en-ka databse --fuzzy          # → データベース (corrects typo)
en-ka compter --mode normal --fuzzy  # Computer + related terms
```

### Detailed Output
```bash
en-ka computer -v
# 1. コンピューター [COMMON]
#    Hiragana: こんぴゅーたー
#    Romaji: konpyūtā
#    Meaning: computer, electronic brain
```

### Limit Results
```bash
en-ka game -m 3        # Show only top 3 results
```

## Commands

| Command | Description |
|---------|-------------|
| `en-ka <word>` | Convert English word to katakana |
| `en-ka suggest <partial>` | Get word suggestions |
| `en-ka update` | Update dictionary data |

## Options

| Option | Description |
|--------|-------------|
| `--mode <mode>` | Search mode: `strict`, `normal`, `broad` (default: strict) |
| `--fuzzy` | Enable fuzzy search for typos |
| `-v, --verbose` | Show hiragana, romaji, detailed meaning |
| `-m, --max <number>` | Maximum results (default: 10) |

## Installation

### From npm (Recommended)
```bash
npm install -g en-ka
```

### From Source
```bash
git clone https://github.com/tolluset/en-ka.git
cd en-ka
pnpm install && pnpm build
pnpm install -g .
```

## Data Source

Uses [JMDict](http://www.edrdg.org/jmdict/j_jmdict.html) Japanese-Multilingual Dictionary via [jmdict-simplified](https://github.com/scriptin/jmdict-simplified).

**License:** [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

Dictionary downloads automatically on first use.

## Development

```bash
pnpm run dev              # Development mode
pnpm run build            # Build
pnpm run lint:type-check  # Type checking
pnpm run lint-fix         # Fix linting
```

## License

Creative Commons Attribution-ShareAlike 4.0 International License