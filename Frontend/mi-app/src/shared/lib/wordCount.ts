export const POST_DESCRIPTION_MIN_WORDS = 200
export const POST_DESCRIPTION_MAX_WORDS = 700

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function isPostDescriptionWordCountValid(text: string): boolean {
  const words = countWords(text)
  return words >= POST_DESCRIPTION_MIN_WORDS && words <= POST_DESCRIPTION_MAX_WORDS
}
