/**
 * Content extractor — strips HTML, truncates, and cleans RSS description content.
 * Interface designed for future LLM swap.
 */

export interface ContentExtractor {
  extract(description: string, maxLength?: number): string
}

const DEFAULT_MAX_LENGTH = 300

/**
 * Strips HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncates text to maxLength, breaking at word boundary, appending ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + '…'
  }

  return truncated + '…'
}

/**
 * Default content extractor using RSS-native data.
 * Strips HTML from description, truncates to reasonable length.
 */
export const rssContentExtractor: ContentExtractor = {
  extract(description: string, maxLength = DEFAULT_MAX_LENGTH): string {
    if (!description) return ''

    const clean = stripHtml(description)
    return truncate(clean, maxLength)
  },
}
