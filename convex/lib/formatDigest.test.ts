import { describe, expect, it } from 'vitest'
import { escapeMarkdownV2, formatDigest, type DigestData } from './formatDigest'

describe('escapeMarkdownV2', () => {
  it('should escape special characters', () => {
    expect(escapeMarkdownV2('Hello_world')).toBe('Hello\\_world')
    expect(escapeMarkdownV2('Test [link]')).toBe('Test \\[link\\]')
    expect(escapeMarkdownV2('Price: $10.00')).toBe('Price: $10\\.00')
  })

  it('should handle text without special chars', () => {
    expect(escapeMarkdownV2('Hello world')).toBe('Hello world')
  })
})

describe('formatDigest', () => {
  it('should format empty digest', () => {
    const data: DigestData = {
      articles: [],
      errors: [],
      date: '2026-02-11',
    }
    const messages = formatDigest(data)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('No new articles')
  })

  it('should format digest with articles', () => {
    const data: DigestData = {
      articles: [
        {
          title: 'Test Article',
          link: 'https://example.com/post',
          summary: 'A great article about testing.',
          feedTitle: 'Example Blog',
        },
      ],
      errors: [],
      date: '2026-02-11',
    }
    const messages = formatDigest(data)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('Daily Digest')
    expect(messages[0]).toContain('Test Article')
    expect(messages[0]).toContain('https://example.com/post')
    expect(messages[0]).toContain('Example Blog')
  })

  it('should format digest with errors', () => {
    const data: DigestData = {
      articles: [],
      errors: [
        {
          feedTitle: 'Broken Feed',
          feedUrl: 'https://broken.com/rss',
          error: 'Connection timeout',
        },
      ],
      date: '2026-02-11',
    }
    const messages = formatDigest(data)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('Failed feeds')
    expect(messages[0]).toContain('Broken Feed')
    expect(messages[0]).toContain('Connection timeout')
  })

  it('should format digest with both articles and errors', () => {
    const data: DigestData = {
      articles: [
        {
          title: 'Good Article',
          link: 'https://example.com/1',
          summary: 'Content here.',
          feedTitle: 'Good Blog',
        },
      ],
      errors: [
        {
          feedTitle: 'Bad Feed',
          feedUrl: 'https://bad.com/rss',
          error: 'DNS failure',
        },
      ],
      date: '2026-02-11',
    }
    const messages = formatDigest(data)
    expect(messages[0]).toContain('Good Article')
    expect(messages[0]).toContain('Failed feeds')
  })

  it('should split long messages', () => {
    const articles = Array.from({ length: 50 }, (_, i) => ({
      title: `Article ${i} with a fairly long title to take up space`,
      link: `https://example.com/post/${i}`,
      summary: 'A '.repeat(100),
      feedTitle: `Feed ${i}`,
    }))

    const data: DigestData = { articles, errors: [], date: '2026-02-11' }
    const messages = formatDigest(data)

    expect(messages.length).toBeGreaterThan(1)
    for (const msg of messages) {
      expect(msg.length).toBeLessThanOrEqual(4096)
    }
  })
})
