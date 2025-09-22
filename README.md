# en-ka (English to Katakana Converter)

A CLI tool that converts English words to Japanese Katakana using the comprehensive JMDict dictionary.

## Features

- **Accurate conversions** using the JMDict dictionary
- **Fuzzy search** for typos and partial matches
- **Rich output** with kanji, hiragana, romaji, and meanings
- **Smart filtering** prioritizes common words
- **Fast local search** with indexed dictionary data

## Installation

```bash
# Clone the repository
git clone https://github.com/tolluset/en-ka.git
cd en-ka

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Install globally (optional)
pnpm install -g .
```

## Usage

### Basic conversion
```bash
en-ka computer
# Output: コンピューター [COMMON]

en-ka server
# Output: サーバー [COMMON]
```

### Fuzzy search (enabled by default)
```bash
en-ka servr
# Output: サーバー [COMMON] (matched "server")

# Disable fuzzy search for exact match only
en-ka --no-fuzzy server
```

### Verbose output
```bash
en-ka -v computer
# Output:
# 1. コンピューター [COMMON]
#    Hiragana: こんぴゅーたー
#    Romaji: konpyūtā
#    Meaning: computer, electronic brain
```

### Multiple results
```bash
en-ka -m 5 game
# Shows up to 5 results
```

### Word suggestions
```bash
en-ka suggest comp
# Output:
# Suggestions for "comp":
# 1. computer
# 2. company
# 3. complete
```

### Update dictionary
```bash
en-ka update
# Downloads latest JMDict data
```

## Options

- `--no-fuzzy` - Disable fuzzy search (exact match only)
- `-v, --verbose` - Show detailed information (hiragana, romaji, meaning)
- `-m, --max <number>` - Maximum number of results (default: 10)

## Examples

```bash
# IT terms
en-ka database          # → データベース
en-ka application       # → アプリケーション
en-ka programming       # → プログラミング

# Common words
en-ka coffee           # → コーヒー
en-ka television       # → テレビ
en-ka telephone        # → 電話

# With fuzzy search (default behavior)
en-ka databse          # → データベース (corrects "databse")

# Exact match only
en-ka --no-fuzzy databse  # → No results (typo not corrected)
```

## Data Source

This tool uses the [JMDict](http://www.edrdg.org/jmdict/j_jmdict.html) Japanese-Multilingual Dictionary, specifically the simplified JSON version from [jmdict-simplified](https://github.com/scriptin/jmdict-simplified).

### Dictionary License

The JMDict dictionary data is licensed under Creative Commons Attribution-ShareAlike 4.0 License. The original data is compiled by the Electronic Dictionary Research and Development Group.

**JMDict License:** [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
**Original Source:** [EDRDG JMDict Project](http://www.edrdg.org/jmdict/j_jmdict.html)
**JSON Format:** [scriptin/jmdict-simplified](https://github.com/scriptin/jmdict-simplified)

The dictionary is automatically downloaded on first use of the application.

## Development

```bash
# Development mode
pnpm run dev

# Type checking
pnpm run lint:type-check

# Linting
pnpm run lint-fix

# Build
pnpm run build
```

## License

Creative Commons Attribution-ShareAlike 4.0 International License