import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('articles.store', () => {
  it('should store a new article', async () => {
    const t = convexTest(schema, modules)

    const feedId = await t.run(async (ctx) => {
      return await ctx.db.insert('feeds', {
        url: 'https://example.com/rss',
        title: 'Example',
        status: 'active',
        consecutiveFailures: 0,
        createdAt: Date.now(),
      })
    })

    const articleId = await t.mutation(internal.articles.store, {
      feedId,
      title: 'Test Article',
      link: 'https://example.com/post/1',
      summary: 'This is a test article summary.',
      publishedAt: Date.now(),
      guid: 'unique-guid-1',
    })

    expect(articleId).toBeDefined()
  })

  it('should deduplicate by guid', async () => {
    const t = convexTest(schema, modules)

    const feedId = await t.run(async (ctx) => {
      return await ctx.db.insert('feeds', {
        url: 'https://example.com/rss',
        title: 'Example',
        status: 'active',
        consecutiveFailures: 0,
        createdAt: Date.now(),
      })
    })

    const article = {
      feedId,
      title: 'Test Article',
      link: 'https://example.com/post/1',
      summary: 'Summary.',
      publishedAt: Date.now(),
      guid: 'same-guid',
    }

    const firstId = await t.mutation(internal.articles.store, article)
    const secondId = await t.mutation(internal.articles.store, article)

    expect(firstId).toBeDefined()
    expect(secondId).toBeNull()
  })
})

describe('articles.getUndigested', () => {
  it('should return only undigested articles', async () => {
    const t = convexTest(schema, modules)

    const feedId = await t.run(async (ctx) => {
      return await ctx.db.insert('feeds', {
        url: 'https://example.com/rss',
        title: 'Example',
        status: 'active',
        consecutiveFailures: 0,
        createdAt: Date.now(),
      })
    })

    await t.mutation(internal.articles.store, {
      feedId,
      title: 'Undigested Article',
      link: 'https://example.com/1',
      summary: 'Summary 1.',
      publishedAt: Date.now(),
      guid: 'guid-1',
    })

    await t.run(async (ctx) => {
      await ctx.db.insert('articles', {
        feedId,
        title: 'Digested Article',
        link: 'https://example.com/2',
        summary: 'Summary 2.',
        publishedAt: Date.now(),
        guid: 'guid-2',
        digestedAt: Date.now(),
      })
    })

    const undigested = await t.query(internal.articles.getUndigested)
    expect(undigested).toHaveLength(1)
    expect(undigested[0].title).toBe('Undigested Article')
  })
})

describe('articles.markDigested', () => {
  it('should mark articles as digested', async () => {
    const t = convexTest(schema, modules)

    const feedId = await t.run(async (ctx) => {
      return await ctx.db.insert('feeds', {
        url: 'https://example.com/rss',
        title: 'Example',
        status: 'active',
        consecutiveFailures: 0,
        createdAt: Date.now(),
      })
    })

    const articleId = await t.mutation(internal.articles.store, {
      feedId,
      title: 'Test',
      link: 'https://example.com/1',
      summary: 'Summary.',
      publishedAt: Date.now(),
      guid: 'guid-1',
    })

    const now = Date.now()
    await t.mutation(internal.articles.markDigested, {
      articleIds: [articleId!],
      digestedAt: now,
    })

    const undigested = await t.query(internal.articles.getUndigested)
    expect(undigested).toHaveLength(0)
  })
})
