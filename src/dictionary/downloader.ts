import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { type JMDictEntry } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

const JMDICT_URL = 'https://github.com/scriptin/jmdict-simplified/releases/download/3.6.1%2B20250915122439/jmdict-eng-common-3.6.1+20250915122439.json.zip';
const DATA_DIR = join(__dirname, '../../data');
const JMDICT_FILE = join(DATA_DIR, 'jmdict-eng-common.json');
const JMDICT_ZIP = join(DATA_DIR, 'jmdict-eng-common.json.zip');

// Sample data for testing
const SAMPLE_DICTIONARY_DATA: JMDictEntry[] = [
  {
    id: "1",
    kana: [{ text: "コンピューター", common: true }],
    sense: [{
      gloss: [{ text: "computer", lang: "eng" }]
    }]
  },
  {
    id: "2",
    kana: [{ text: "サーバー", common: true }],
    sense: [{
      gloss: [{ text: "server", lang: "eng" }]
    }]
  },
  {
    id: "3",
    kana: [{ text: "データベース", common: true }],
    sense: [{
      gloss: [{ text: "database", lang: "eng" }]
    }]
  },
  {
    id: "4",
    kana: [{ text: "プログラミング", common: true }],
    sense: [{
      gloss: [{ text: "programming", lang: "eng" }]
    }]
  },
  {
    id: "5",
    kana: [{ text: "アプリケーション", common: true }, { text: "アプリ", common: true }],
    sense: [{
      gloss: [{ text: "application", lang: "eng" }]
    }]
  },
  {
    id: "6",
    kana: [{ text: "ジャバスクリプト", common: true }],
    sense: [{
      gloss: [{ text: "JavaScript", lang: "eng" }]
    }]
  },
  {
    id: "7",
    kana: [{ text: "インターネット", common: true }, { text: "ネット", common: true }],
    sense: [{
      gloss: [{ text: "internet", lang: "eng" }, { text: "net", lang: "eng" }]
    }]
  },
  {
    id: "8",
    kana: [{ text: "ウェブサイト", common: true }, { text: "サイト", common: true }],
    sense: [{
      gloss: [{ text: "website", lang: "eng" }, { text: "site", lang: "eng" }]
    }]
  }
];

export async function downloadJMDict(force = false): Promise<string> {
  if (!force && existsSync(JMDICT_FILE)) {
    console.log('Dictionary data already exists, using cached version');
    return JMDICT_FILE;
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    // Try downloading real JMDict data
    console.log('Downloading JMDict data from GitHub...');
    await downloadRealJMDict();
    console.log('JMDict data downloaded and extracted successfully!');
    return JMDICT_FILE;
  } catch (error) {
    console.log('Failed to download JMDict data, falling back to sample data...');
    console.log(`Error: ${error}`);

    // Fallback to sample data
    writeFileSync(JMDICT_FILE, JSON.stringify(SAMPLE_DICTIONARY_DATA, null, 2));
    console.log('Sample dictionary data created successfully');
    console.log('Note: This is a sample dataset. For full JMDict data, try:');
    console.log('  en-ka update --force');
    return JMDICT_FILE;
  }
}

async function downloadRealJMDict(): Promise<void> {
  // Use curl to download the zip file
  console.log('Downloading zip file...');
  await execAsync(`curl -L -o "${JMDICT_ZIP}" "${JMDICT_URL}"`);

  if (!existsSync(JMDICT_ZIP)) {
    throw new Error('Download failed - zip file not created');
  }

  // Extract the zip file
  console.log('Extracting zip file...');
  await execAsync(`cd "${DATA_DIR}" && unzip -o "${JMDICT_ZIP}"`);

  // Find the extracted JSON file and rename it
  const extractedFile = join(DATA_DIR, 'jmdict-eng-common-3.6.1.json');

  if (existsSync(extractedFile)) {
    await execAsync(`mv "${extractedFile}" "${JMDICT_FILE}"`);
  } else {
    throw new Error('Extracted JSON file not found');
  }

  // Clean up zip file
  await execAsync(`rm -f "${JMDICT_ZIP}"`);
}

export function getJMDictPath(): string {
  return JMDICT_FILE;
}

export function isJMDictAvailable(): boolean {
  return existsSync(JMDICT_FILE);
}