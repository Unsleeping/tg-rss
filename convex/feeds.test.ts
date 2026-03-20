import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('feeds', () => {
  it('should add a feed', async () => {
    const t = convexTest(schema, modules)
    const url = 'https://example.com/rss'
    const feedId = await t.mutation(api.feeds.add, { url })
    expect(feedId).toBeDefined()

    const feeds = await t.query(internal.feeds.list)
    expect(feeds).toHaveLength(1)
    expect(feeds[0].url).toBe(url)
  })

  it('should prevent duplicate feeds', async () => {
    const t = convexTest(schema, modules)
    const url = 'https://example.com/rss'
    await t.mutation(api.feeds.add, { url })
    await expect(t.mutation(api.feeds.add, { url })).rejects.toThrow(
      'already exists',
    )
  })

  it('should remove a feed', async () => {
    const t = convexTest(schema, modules)
    const feedId = await t.mutation(api.feeds.add, {
      url: 'https://example.com/rss',
    })
    await t.mutation(api.feeds.remove, { feedId })

    const feeds = await t.query(internal.feeds.list)
    expect(feeds).toHaveLength(0)
  })

  it('should fail to remove non-existent feed', async () => {
    const t = convexTest(schema, modules)
    const fakeId = 'kj7...' as any
    await expect(
      t.mutation(api.feeds.remove, { feedId: fakeId }),
    ).rejects.toThrow()
  })

  it('should list active feeds', async () => {
    const t = convexTest(schema, modules)
    const feedId = await t.mutation(api.feeds.add, {
      url: 'https://a.com/rss',
    })
    await t.mutation(api.feeds.add, { url: 'https://b.com/rss' })

    await t.mutation(internal.feeds.updateStatus, {
      feedId,
      status: 'unhealthy',
    })

    const activeFeeds = await t.query(internal.feeds.listActive)
    expect(activeFeeds).toHaveLength(1)
    expect(activeFeeds[0].url).toBe('https://b.com/rss')
  })

  it('should update feed status', async () => {
    const t = convexTest(schema, modules)
    const feedId = await t.mutation(api.feeds.add, {
      url: 'https://example.com/rss',
    })

    await t.mutation(internal.feeds.updateStatus, {
      feedId,
      status: 'unhealthy',
      consecutiveFailures: 3,
    })

    const feeds = await t.query(internal.feeds.list)
    expect(feeds[0]).toMatchObject({
      status: 'unhealthy',
      consecutiveFailures: 3,
    })
  })

  it('should update last fetched time', async () => {
    const t = convexTest(schema, modules)
    const feedId = await t.mutation(api.feeds.add, {
      url: 'https://example.com/rss',
    })

    const now = Date.now()
    await t.mutation(internal.feeds.updateStatus, {
      feedId,
      status: 'active',
      lastFetchedAt: now,
    })

    const feeds = await t.query(internal.feeds.list)
    expect(feeds[0].lastFetchedAt).toBe(now)
  })
})
