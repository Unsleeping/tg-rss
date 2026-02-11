import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  feeds: defineTable({
    url: v.string(),
    title: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('unhealthy'),
      v.literal('paused'),
    ),
    consecutiveFailures: v.number(),
    lastFetchedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_status', ['status']),

  articles: defineTable({
    feedId: v.id('feeds'),
    title: v.string(),
    link: v.string(),
    summary: v.string(),
    publishedAt: v.number(),
    guid: v.string(),
    digestedAt: v.optional(v.number()),
  })
    .index('by_guid', ['guid'])
    .index('by_feed', ['feedId'])
    .index('by_undigested', ['digestedAt']),

  digests: defineTable({
    sentAt: v.number(),
    articleCount: v.number(),
    failedFeeds: v.array(v.string()),
    status: v.union(v.literal('sent'), v.literal('failed')),
  }),

  fetchErrors: defineTable({
    feedId: v.id('feeds'),
    error: v.string(),
    occurredAt: v.number(),
  }).index('by_feed', ['feedId']),
})
