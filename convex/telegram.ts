'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'

export const sendMessage = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      console.error(
        'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in Convex environment variables',
      )
      return
    }

    console.log(
      `Sending message to chat ${chatId}: ${args.text.substring(0, 50)}...`,
    )

    const url = `https://api.telegram.org/bot${token}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: args.text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Telegram API error: ${error}`)
      throw new Error(`Telegram API error: ${error}`)
    }
    console.log('Message sent successfully')
  },
})
