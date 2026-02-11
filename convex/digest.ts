import { v } from 'convex/values'
import { internalAction, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { formatDigest } from './lib/formatDigest'
import { Doc, Id } from './_generated/dataModel'

interface DigestArticle {
  title: string
  link: string
  summary: string
  feedTitle: string
}

interface DigestError {
  feedTitle: string
  feedUrl: string
  error: string
}

export const runDailyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const activeFeeds = await ctx.runQuery(internal.feeds.listActive)

    // 1. Trigger all feed fetches
    for (const feed of activeFeeds) {
      await ctx.scheduler.runAfter(0, internal.rss.fetchFeed, {
        feedId: feed._id,
        url: feed.url,
      })
    }

    // 2. Schedule collector (wait for fetches to finish)
    // We wait 5 minutes to give feeds time to fetch and retry
    await ctx.scheduler.runAfter(300_000, internal.digest.collectAndSend, {})
  },
})

export const collectAndSend = internalAction({
  args: {},
  handler: async (ctx) => {
    const undigested = await ctx.runQuery(internal.articles.getUndigested)

    // Get feed titles for better formatting
    const feeds: Doc<'feeds'>[] = await ctx.runQuery(internal.feeds.list)
    const feedMap = new Map<Id<'feeds'>, string>(
      feeds.map((f: Doc<'feeds'>) => [f._id, f.title]),
    )

    const articles: DigestArticle[] = undigested.map((a: Doc<'articles'>) => ({
      title: a.title,
      link: a.link,
      summary: a.summary,
      feedTitle: feedMap.get(a.feedId) ?? 'Unknown Feed',
    }))

    // Get recent errors (last 24h)
    const since = Date.now() - 24 * 60 * 60 * 1000
    const errors = await ctx.runQuery(internal.fetchErrors.getRecent, { since })

    const digestErrors: DigestError[] = errors.map((e: Doc<'fetchErrors'>) => {
      const feed = feeds.find((f: Doc<'feeds'>) => f._id === e.feedId)
      return {
        feedTitle: feed?.title ?? 'Unknown Feed',
        feedUrl: feed?.url ?? '',
        error: e.error,
      }
    })

    const date = new Date().toISOString().split('T')[0]
    const messages = formatDigest({
      articles,
      errors: digestErrors,
      date,
    })

    // Send messages to Telegram
    for (const msg of messages) {
      await ctx.runAction(internal.telegram.sendMessage, { text: msg })
    }

    // Mark articles as digested
    if (undigested.length > 0) {
      await ctx.runMutation(internal.articles.markDigested, {
        articleIds: undigested.map((a) => a._id),
        digestedAt: Date.now(),
      })
    }

    // Record digest completion
    await ctx.runMutation(internal.digest.recordDigest, {
      articleCount: undigested.length,
      failedFeeds: Array.from(
        new Set(digestErrors.map((e: { feedTitle: string }) => e.feedTitle)),
      ),
    })
  },
})

export const recordDigest = internalMutation({
  args: {
    articleCount: v.number(),
    failedFeeds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('digests', {
      sentAt: Date.now(),
      articleCount: args.articleCount,
      failedFeeds: args.failedFeeds,
      status: 'sent',
    })
  },
})
