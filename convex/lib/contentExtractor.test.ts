import { describe, expect, it } from 'vitest'
import { rssContentExtractor, stripHtml, truncate } from './contentExtractor'

describe('stripHtml', () => {
  it('should strip HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('should decode HTML entities', () => {
    expect(stripHtml('Tom &amp; Jerry &lt;3&gt;')).toBe('Tom & Jerry <3>')
  })

  it('should collapse whitespace', () => {
    expect(stripHtml('Hello   \n\n  world')).toBe('Hello world')
  })

  it('should handle &nbsp;', () => {
    expect(stripHtml('Hello&nbsp;world')).toBe('Hello world')
  })

  it('should handle empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('should handle complex HTML', () => {
    const html = `
      <div class="post">
        <h1>Title</h1>
        <p>First paragraph with <a href="https://example.com">a link</a>.</p>
        <p>Second paragraph.</p>
      </div>
    `
    expect(stripHtml(html)).toBe(
      'Title First paragraph with a link. Second paragraph.',
    )
  })
})

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('Hello', 100)).toBe('Hello')
  })

  it('should truncate at word boundary', () => {
    const result = truncate('Hello beautiful world today', 20)
    expect(result).toBe('Hello beautiful…')
    expect(result.length).toBeLessThanOrEqual(21)
  })

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('should add ellipsis when truncating', () => {
    const result = truncate('A very long text that needs truncation', 15)
    expect(result).toContain('…')
  })
})

describe('rssContentExtractor', () => {
  it('should extract clean text from HTML description', () => {
    const result = rssContentExtractor.extract(
      '<p>This is a <b>test</b> article description.</p>',
    )
    expect(result).toBe('This is a test article description.')
  })

  it('should return empty string for empty input', () => {
    expect(rssContentExtractor.extract('')).toBe('')
  })

  it('should truncate long descriptions', () => {
    const long = 'A '.repeat(200)
    const result = rssContentExtractor.extract(long, 50)
    expect(result.length).toBeLessThanOrEqual(51) // +1 for ellipsis char
    expect(result).toContain('…')
  })

  it('should handle plain text without HTML', () => {
    const result = rssContentExtractor.extract('Just plain text here.')
    expect(result).toBe('Just plain text here.')
  })

  it('should respect custom maxLength', () => {
    const result = rssContentExtractor.extract(
      'Short text that should not be truncated.',
      1000,
    )
    expect(result).toBe('Short text that should not be truncated.')
  })
})
