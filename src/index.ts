#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { EnglishToKatakanaConverter } from './converter.js';
import { type ConversionResult } from './types.js';

const program = new Command();

program
  .name('en-ka')
  .description('English to Katakana converter using JMDict')
  .version('1.0.0');

program
  .argument('<word>', 'English word or phrase to convert')
  .option('--no-fuzzy', 'Disable fuzzy search (exact match only)')
  .option('-v, --verbose', 'Show detailed information including romaji and meaning')
  .option('-m, --max <number>', 'Maximum number of results (default: 10)', '10')
  .action(async (word: string, options) => {
    try {
      const converter = new EnglishToKatakanaConverter();

      console.log(chalk.blue('Loading dictionary...'));
      await converter.initialize();

      const results = await converter.convert(word, {
        fuzzy: options.fuzzy !== false, // fuzzy is true by default unless --no-fuzzy is used
        verbose: options.verbose,
        maxResults: parseInt(options.max)
      });

      if (results.length === 0) {
        console.log(chalk.red(`No results found for "${word}"`));

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