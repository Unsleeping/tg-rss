import { v } from 'convex/values'
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from './_generated/server'

export const add = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const url = args.url.trim()
    if (!url) {
      throw new Error('Feed URL cannot be empty')
    }

    try {
      new URL(url)
    } catch {
      throw new Error(`Invalid URL: ${url}`)
    }

    const existing = await ctx.db
      .query('feeds')
      .filter((q) => q.eq(q.field('url'), url))
      .first()

    if (existing) {
      throw new Error(`Feed already exists: ${url}`)
    }

    const feedId = await ctx.db.insert('feeds', {
      url,
      title: args.title ?? url,
      status: 'active',
      consecutiveFailures: 0,
      createdAt: Date.now(),
    })

    return feedId
  },
})

export const remove = mutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId)
    if (!feed) {
      throw new Error('Feed not found')
    }
    await ctx.db.delete(args.feedId)
  },
})

export const list = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('feeds').collect()
  },
})

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('feeds').collect()
  },
})

export const listActive = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('feeds')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()
  },
})

export const updateStatus = internalMutation({
  args: {
    feedId: v.id('feeds'),
    status: v.union(
      v.literal('active'),
      v.literal('unhealthy'),
      v.literal('paused'),
    ),
    consecutiveFailures: v.optional(v.number()),
    lastFetchedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId)
    if (!feed) {
      throw new Error('Feed not found')
    }

    await ctx.db.patch(args.feedId, {
      status: args.status,
      ...(args.consecutiveFailures !== undefined && {
        consecutiveFailures: args.consecutiveFailures,
      }),
      ...(args.lastFetchedAt !== undefined && {
        lastFetchedAt: args.lastFetchedAt,
      }),
    })
  },
})

export const incrementFailure = internalMutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId)
    if (!feed) return

    const consecutiveFailures = feed.consecutiveFailures + 1
    const status = consecutiveFailures >= 3 ? 'unhealthy' : feed.status

    await ctx.db.patch(args.feedId, {
      consecutiveFailures,
      status,
    })
  },
})
