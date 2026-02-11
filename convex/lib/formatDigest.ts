/**
 * Formats articles and errors into a Telegram-friendly digest message.
 * Uses Telegram MarkdownV2 format.
 */

export interface DigestArticle {
  title: string
  link: string
  summary: string
  feedTitle: string
}

export interface DigestError {
  feedTitle: string
  feedUrl: string
  error: string
}

export interface DigestData {
  articles: DigestArticle[]
  errors: DigestError[]
  date: string
}

const TELEGRAM_MAX_LENGTH = 4096

/**
 * Escapes special characters for Telegram MarkdownV2.
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
}

/**
 * Formats a single article for the digest.
 */
function formatArticle(article: DigestArticle): string {
  const title = escapeMarkdownV2(article.title)
  const summary = escapeMarkdownV2(article.summary)
  const feedTitle = escapeMarkdownV2(article.feedTitle)

  return `📌 [${title}](${article.link})\n_from ${feedTitle}_\n${summary}`
}

/**
 * Formats digest data into Telegram messages.
 * Splits into multiple messages if content exceeds Telegram's 4096 char limit.
 */
export function formatDigest(data: DigestData): string[] {
  if (data.articles.length === 0 && data.errors.length === 0) {
    return [`📭 *No new articles for ${escapeMarkdownV2(data.date)}*`]
  }

  const header = `📰 *Daily Digest — ${escapeMarkdownV2(data.date)}*\n\n`
  const parts: string[] = []

  // Format articles
  if (data.articles.length > 0) {
    const articleLines = data.articles.map(formatArticle)
    parts.push(...articleLines)
  }

  // Format errors section
  if (data.errors.length > 0) {
    const errorHeader = '\n⚠️ *Failed feeds:*\n'
    const errorLines = data.errors.map(
      (e) => `• ${escapeMarkdownV2(e.feedTitle)}: ${escapeMarkdownV2(e.error)}`,
    )
    parts.push(errorHeader + errorLines.join('\n'))
  }

  // Split into messages respecting Telegram limit
  const messages: string[] = []
  let current = header

  for (const part of parts) {
    const separator = current === header ? '' : '\n\n'
    if (current.length + separator.length + part.length > TELEGRAM_MAX_LENGTH) {
      if (current !== header) {
        messages.push(current)
      }
      current = part
    } else {
      current += separator + part
    }
  }

  if (current) {
    messages.push(current)
  }

  return messages
}
