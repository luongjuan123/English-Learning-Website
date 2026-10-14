/**
 * Deterministic word list parser and serializer
 */

export interface ParsedWordListResult {
  words: string[];
  count: number;
  originalCount: number;
  duplicatesRemoved: number;
}

/**
 * Parses raw text input supporting newline-separated or comma-separated words/phrases.
 * Trims whitespace, ignores empty lines, and deduplicates case-insensitively
 * while preserving the original spelling of the first occurrence.
 */
export function parseWordList(rawInput: string): ParsedWordListResult {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      words: [],
      count: 0,
      originalCount: 0,
      duplicatesRemoved: 0,
    };
  }

  // Split by newlines, carriage returns, or commas
  const rawItems = rawInput
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const seenLower = new Set<string>();
  const uniqueWords: string[] = [];

  for (const item of rawItems) {
    const lower = item.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueWords.push(item);
    }
  }

  return {
    words: uniqueWords,
    count: uniqueWords.length,
    originalCount: rawItems.length,
    duplicatesRemoved: rawItems.length - uniqueWords.length,
  };
}

/**
 * Formats a word list into plain text (one word per line)
 */
export function wordsToPlainText(words: string[]): string {
  return words.join("\n");
}

/**
 * Formats a word list into CSV format
 */
export function wordsToCSV(words: string[]): string {
  return words.map((w) => (w.includes(",") || w.includes('"') ? `"${w.replace(/"/g, '""')}"` : w)).join(",");
}

/**
 * Parses a CSV string into an array of words
 */
export function parseCSVWords(csvContent: string): string[] {
  return parseWordList(csvContent).words;
}
