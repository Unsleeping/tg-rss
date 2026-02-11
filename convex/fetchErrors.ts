import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

export const record = internalMutation({
  args: {
    feedId: v.id('feeds'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('fetchErrors', {
      feedId: args.feedId,
      error: args.error,
      occurredAt: Date.now(),
    })
  },
})

export const getRecent = internalQuery({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('fetchErrors')
      .filter((q) => q.gte(q.field('occurredAt'), args.since))
      .collect()
  },
})
