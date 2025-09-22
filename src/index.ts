#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EnglishToKatakanaConverter } from './converter.js';
import { type ConversionResult, type SearchMode } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('en-ka')
  .description('English to Katakana converter using JMDict')
  .version(packageJson.version);

program
  .argument('<word>', 'English word or phrase to convert')
  .option('--mode <mode>', 'Search mode: strict (exact), normal (compound), broad (all)', 'strict')
  .option('--fuzzy', 'Enable fuzzy search for approximate matches')
  .option('-v, --verbose', 'Show detailed information including romaji and meaning')
  .option('-m, --max <number>', 'Maximum number of results (default: 10)', '10')
  .action(async (word: string, options) => {
    try {
      const converter = new EnglishToKatakanaConverter();

      console.log(chalk.blue('Loading dictionary...'));
      await converter.initialize();

      // Validate search mode
      const validModes: SearchMode[] = ['strict', 'normal', 'broad'];
      const searchMode = options.mode as SearchMode;
      if (!validModes.includes(searchMode)) {
        console.error(chalk.red(`Invalid mode "${options.mode}". Valid modes are: strict, normal, broad`));
        process.exit(1);
      }

      const results = await converter.convert(word, {
        mode: searchMode,
        fuzzy: options.fuzzy === true, // fuzzy is false by default, enabled with --fuzzy
        verbose: options.verbose,
        maxResults: parseInt(options.max)
      });

      if (results.length === 0) {
        console.log(chalk.red(`No results found for "${word}"`));

        // Suggest trying different modes if in strict mode
        if (searchMode === 'strict') {
          console.log(chalk.yellow('\nTry different search modes:'));
          console.log(chalk.gray(`  en-ka ${word} --mode normal   # Include compound words`));
          console.log(chalk.gray(`  en-ka ${word} --mode broad    # Include all related terms`));
          console.log(chalk.gray(`  en-ka ${word} --fuzzy         # Enable fuzzy matching`));
        } else if (searchMode === 'normal') {
          console.log(chalk.yellow('\nTry broader search:'));
          console.log(chalk.gray(`  en-ka ${word} --mode broad    # Include all related terms`));
          console.log(chalk.gray(`  en-ka ${word} --fuzzy         # Enable fuzzy matching`));
        } else {
          console.log(chalk.yellow('\nTry fuzzy search:'));
          console.log(chalk.gray(`  en-ka ${word} --fuzzy         # Enable fuzzy matching`));
        }

        // Show suggestions
        const suggestions = await converter.searchSuggestions(word.slice(0, 3));
        if (suggestions.length > 0) {
          console.log(chalk.cyan('\nSuggestions:'));
          suggestions.slice(0, 5).forEach(suggestion => {
            console.log(chalk.gray(`  ${suggestion}`));
          });
        }
        return;
      }

      console.log(chalk.green(`\nResults for "${word}":\n`));

      results.forEach((result, index) => {
        if (options.verbose) {
          printVerboseResult(result, index + 1);
        } else {
          printSimpleResult(result, index + 1);
        }
      });

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update dictionary data')
  .option('--force', 'Force download even if data exists')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Updating dictionary...'));

      // Force re-download if requested
      if (options.force) {
        const { downloadJMDict } = await import('./dictionary/downloader.js');
        await downloadJMDict(true);
      }

      const converter = new EnglishToKatakanaConverter();
      await converter.initialize();
      console.log(chalk.green('Dictionary updated successfully!'));
    } catch (error) {
      console.error(chalk.red('Update failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('suggest <partial>')
  .description('Get word suggestions based on partial input')
  .action(async (partial: string) => {
    try {
      const converter = new EnglishToKatakanaConverter();
      await converter.initialize();

      const suggestions = await converter.searchSuggestions(partial);

      if (suggestions.length === 0) {
        console.log(chalk.yellow(`No suggestions found for "${partial}"`));
        return;
      }

      console.log(chalk.cyan(`Suggestions for "${partial}":\n`));
      suggestions.forEach((suggestion, index) => {
        console.log(chalk.white(`${index + 1}. ${suggestion}`));
      });

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printSimpleResult(result: ConversionResult, index: number): void {
  const commonBadge = result.common ? chalk.bgGreen(' COMMON ') : chalk.bgGray(' RARE ');
  console.log(`${chalk.bold(index)}. ${chalk.magenta(result.katakana)} ${commonBadge}`);

  if (result.kanji) {
    console.log(`   ${chalk.gray('Kanji:')} ${result.kanji}`);
  }

  if (result.meaning) {
    console.log(`   ${chalk.gray('Meaning:')} ${result.meaning}`);
  }

  console.log();
}

function printVerboseResult(result: ConversionResult, index: number): void {
  const commonBadge = result.common ? chalk.bgGreen(' COMMON ') : chalk.bgGray(' RARE ');

  console.log(`${chalk.bold(index)}. ${chalk.magenta.bold(result.katakana)} ${commonBadge}`);

  if (result.hiragana) {
    console.log(`   ${chalk.gray('Hiragana:')} ${result.hiragana}`);
  }

  if (result.kanji) {
    console.log(`   ${chalk.gray('Kanji:')} ${result.kanji}`);
  }

  if (result.romaji) {
    console.log(`   ${chalk.gray('Romaji:')} ${result.romaji}`);
  }

  if (result.meaning) {
    console.log(`   ${chalk.gray('Meaning:')} ${result.meaning}`);
  }

  console.log();
}

program.parse();