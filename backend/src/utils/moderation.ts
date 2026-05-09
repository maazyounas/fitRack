const badWords = require('bad-words');
const Filter = badWords.Filter;
const filter = new Filter();

export function cleanText(text: string): string {
  if (!text) return '';
  try {
    return filter.clean(text);
  } catch (error) {
    console.error('Profanity filter error', error);
    return text;
  }
}

export function isProfane(text: string): boolean {
  if (!text) return false;
  try {
    return filter.isProfane(text);
  } catch (error) {
    return false;
  }
}
