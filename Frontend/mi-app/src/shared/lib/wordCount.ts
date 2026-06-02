export const POST_DESCRIPTION_MIN_WORDS = 0
export const POST_DESCRIPTION_MAX_WORDS = 700

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function isPostDescriptionWordCountValid(text: string): boolean {
  const words = countWords(text)
  return words <= POST_DESCRIPTION_MAX_WORDS
}

export function getWordTruncatedText(text: string, maxWords: number): { truncatedText: string; needsToggle: boolean } {
  const wordsRegex = /[^\s]+/g
  let wordCount = 0
  let lastCharIndex = 0
  while (wordsRegex.exec(text) !== null) {
    wordCount++
    if (wordCount === maxWords) {
      lastCharIndex = wordsRegex.lastIndex
      break
    }
  }
  
  if (wordCount < maxWords) {
    return { truncatedText: text, needsToggle: false }
  }
  
  return {
    truncatedText: text.slice(0, lastCharIndex) + '…',
    needsToggle: true
  }
}

