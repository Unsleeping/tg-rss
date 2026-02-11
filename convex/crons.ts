import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Every day at 7:00 AM UTC
crons.daily(
  'run daily rss digest',
  { hourUTC: 7, minuteUTC: 0 },
  internal.digest.runDailyDigest,
)

export default crons
