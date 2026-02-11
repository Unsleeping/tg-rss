import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

export const store = internalMutation({
  args: {
    feedId: v.id('feeds'),
    title: v.string(),
    link: v.string(),
    summary: v.string(),
    publishedAt: v.number(),
    guid: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('articles')
      .withIndex('by_guid', (q) => q.eq('guid', args.guid))
      .first()

    if (existing) {
      return null
    }

    return await ctx.db.insert('articles', {
      feedId: args.feedId,
      title: args.title,
      link: args.link,
      summary: args.summary,
      publishedAt: args.publishedAt,
      guid: args.guid,
    })
  },
})

export const getUndigested = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('articles')
      .withIndex('by_undigested', (q) => q.eq('digestedAt', undefined))
      .collect()
  },
})

export const markDigested = internalMutation({
  args: {
    articleIds: v.array(v.id('articles')),
    digestedAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const articleId of args.articleIds) {
      await ctx.db.patch(articleId, { digestedAt: args.digestedAt })
    }
  },
})
