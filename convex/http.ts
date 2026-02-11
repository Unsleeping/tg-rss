import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { api } from './_generated/api'

const http = httpRouter()

http.route({
  path: '/',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      console.error('Failed to parse JSON body:', e)
      return new Response('Invalid JSON', { status: 400 })
    }
    console.log('Received webhook:', JSON.stringify(body, null, 2))

    // Simple basic command handling
    const message = body.message
    if (message?.text) {
      const text = message.text as string
      const chatId = message.chat.id

      // Basic security check (optional, but good if you have a specific chat ID)
      if (
        process.env.TELEGRAM_CHAT_ID &&
        String(chatId) !== process.env.TELEGRAM_CHAT_ID
      ) {
        console.log(
          `Chat ID mismatch: expected ${process.env.TELEGRAM_CHAT_ID}, got ${chatId}`,
        )
        return new Response(null, { status: 200 })
      }
      console.log(`Processing command: ${text} from chat ${chatId}`)

      if (text.startsWith('/add')) {
        const url = text.replace('/add', '').trim()
        if (url) {
          try {
            await ctx.runMutation(api.feeds.add, { url })
            await ctx.runAction(internal.telegram.sendMessage, {
              text: escapeMarkdownV2(`✅ Added feed: ${url}`),
            })
          } catch (e: any) {
            await ctx.runAction(internal.telegram.sendMessage, {
              text: escapeMarkdownV2(`❌ Error: ${e.message}`),
            })
          }
        }
      } else if (text.startsWith('/list')) {
        const feeds = await ctx.runQuery(api.feeds.listPublic)
        const listText =
          feeds.length > 0
            ? `📋 *Subscriptions:*\n` +
              feeds
                .map(
                  (f: any) => `• ${f.title} (${f.status}) \`/remove_${f._id}\``,
                )
                .join('\n')
            : '📭 No subscriptions'
        await ctx.runAction(internal.telegram.sendMessage, {
          text: escapeMarkdownV2(listText),
        })
      } else if (text.startsWith('/digest')) {
        await ctx.runAction(internal.digest.runDailyDigest, {})
        await ctx.runAction(internal.telegram.sendMessage, {
          text: escapeMarkdownV2('⏳ Triggering manual digest...'),
        })
      }
    } else {
      console.log('Ignoring non-text message or empty update')
    }

    return new Response(null, { status: 200 })
  }),
})

http.route({
  path: '/',
  method: 'GET',
  handler: httpAction(async (_ctx) => {
    return new Response(
      'TG RSS Bot is running! Use this URL for your Telegram Webhook.',
      { status: 200 },
    )
  }),
})

// Helper to escape for TG MarkdownV2 (duplicates logic from lib, but keeps http.ts self-contained)
function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
}

export default http
