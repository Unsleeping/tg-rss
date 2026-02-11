# TG RSS Digest Bot - Agent Notes

## Architectural Decisions

- **Convex-only**: Decided to use Convex for everything (database, crons, actions, HTTP). This avoids managing multiple services and keeps latency low.
- **Fan-out pattern**: Large digests (many feeds) could hit the 10-minute action limit. Each feed is fetched by its own action (`rss.fetchFeed`), and results are collected by `digest.collectAndSend`.
- **TDD approach**: Core logic (content extraction, message formatting, feed CRUD) is fully tested via `vitest` and `convex-test`.
- **"use node" directive**: Necessary for `rss-parser` as it depends on Node.js APIs not available in the lightweight Convex default runtime.

## Gotchas & Lessons Learned

- **Convex Cron Testing**: `convex-test` does not natively support testing crons. Instead, test the target function (`internal.digest.runDailyDigest`) directly.
- **Action Parallelism**: Convex actions don't wait for scheduled functions. The "Collector" pattern (scheduling a follow-up action) is used to gather results after asynchronous tasks.
- **Telegram Formatting**: MarkdownV2 is very sensitive to special characters. An `escapeMarkdownV2` utility is crucial to prevent "Bad Request" errors from the Telegram API.
- **Deduplication**: RSS feeds often repeat items. GUID-based deduplication in `articles.ts` prevents duplicate entries in the digest.

## Future Improvement Ideas

- **LLM Summarization**: The `ContentExtractor` interface is ready for an OpenAI/Anthropic swap.
- **Individual User Support**: Currently hardcoded to one `TELEGRAM_CHAT_ID`. Could be extended to support multiple users if needed.
- **Web UI**: If subscription management via Telegram becomes cumbersome, a small React frontend can be added easily.
