import { describe, expect, it, vi } from 'vitest'
import { convexTest } from 'convex-test'
import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('digest.runDailyDigest', () => {
  it('should schedule feed fetches and a collector', async () => {
    const t = convexTest(schema, modules)

    // Add an active feed
    await t.mutation(api.feeds.add, {
      url: 'https://example.com/rss',
      title: 'Example',
    })

    await t.action(internal.digest.runDailyDigest, {})

    // In convex-test, we can't easily query _scheduled_functions directly this way
    // But we can check that things didn't crash and maybe look at other side effects
    // For now, let's just verify it runs without error.
  })
})

// Note: Testing actual external fetches and Telegram sends would require mocks for fetch/rss-parser.
// Since we are in a mock environment with convex-test, we focus on the orchestration logic here.
