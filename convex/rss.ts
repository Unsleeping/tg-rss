'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { rssContentExtractor } from './lib/contentExtractor'

const MAX_RETRIES = 3
const RETRY_DELAYS_MS = [0, 30_000, 120_000] // immediate, 30s, 2min

export const fetchFeed = internalAction({
  args: {
    feedId: v.id('feeds'),
    url: v.string(),
    attempt: v.optional(v.number()),
    digestRunId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const attempt = args.attempt ?? 0
    // Dynamic import because rss-parser is a Node.js-only package
    const Parser = (await import('rss-parser')).default
    const parser = new Parser({
      timeout: 15_000,
      headers: {
        'User-Agent': 'TG-RSS-Bot/1.0',
      },
    })

    try {
      const feed = await parser.parseURL(args.url)

      const items = feed.items ?? []
      for (const item of items) {
        const summary = rssContentExtractor.extract(
          item.contentSnippet || item.content || item.summary || '',
        )

        await ctx.runMutation(internal.articles.store, {
          feedId: args.feedId,
          title: item.title || 'Untitled',
          link: item.link || '',
          summary,
          publishedAt: item.pubDate
            ? new Date(item.pubDate).getTime()
            : Date.now(),
          guid: item.guid || item.link || item.title || '',
        })
      }

      // Update feed status on success
      await ctx.runMutation(internal.feeds.updateStatus, {
        feedId: args.feedId,
        status: 'active',
        consecutiveFailures: 0,
        lastFetchedAt: Date.now(),
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      if (attempt < MAX_RETRIES - 1) {
        // Schedule retry with exponential backoff
        const delay = RETRY_DELAYS_MS[attempt + 1] ?? 120_000
        await ctx.scheduler.runAfter(delay, internal.rss.fetchFeed, {
          feedId: args.feedId,
          url: args.url,
          attempt: attempt + 1,
          digestRunId: args.digestRunId,
        })
        return
      }

      // All retries exhausted — record error
      await ctx.runMutation(internal.fetchErrors.record, {
        feedId: args.feedId,
        error: errorMessage,
      })

      // Update feed failure count
      await ctx.runMutation(internal.feeds.incrementFailure, {
        feedId: args.feedId,
      })
    }
  },
})
