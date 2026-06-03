import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  fetchSubredditTopPosts,
  fetchUpvotedPosts,
  refreshRedditTokens,
} from "@/lib/reddit"
import { getRedditSession, setRedditSession } from "@/lib/reddit-session"

const DB_AVAILABLE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const reddit = await getRedditSession()
  if (!reddit) return NextResponse.json({ error: "Reddit not connected" }, { status: 401 })

  let { access_token, refresh_token, expires_at, username } = reddit

  if (Date.now() / 1000 > expires_at - 60) {
    const refreshed = await refreshRedditTokens(refresh_token)
    access_token = refreshed.access_token!
    await setRedditSession({ access_token, refresh_token: refreshed.refresh_token ?? refresh_token, expires_at: refreshed.expires_at!, username })
  }

  const body = await req.json()
  const subreddits: string[] = body.subreddits ?? []
  const includeUpvoted: boolean = body.includeUpvoted ?? false
  const timeframe: "week" | "month" = body.timeframe ?? "week"

  try {
    const [subredditResults, upvoteResult] = await Promise.all([
      Promise.all(subreddits.map((s) => fetchSubredditTopPosts(access_token, s, timeframe))),
      includeUpvoted ? fetchUpvotedPosts(access_token, username) : Promise.resolve({ posts: [], isPrivate: false }),
    ])

    const subredditPosts = subredditResults.flat()
    const posts = [...subredditPosts, ...upvoteResult.posts]

    // Deduplicate by id
    const seen = new Set<string>()
    const deduped = posts.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    // Persist to DB if available
    if (DB_AVAILABLE && deduped.length > 0) {
      try {
        const { getUserIdByTwitterId, upsertRedditSaves, setSyncState } = await import("@/lib/db")
        const userId = await getUserIdByTwitterId(session.twitterId)
        if (userId) {
          await upsertRedditSaves(userId, deduped)
          await setSyncState(userId, { reddit_last_synced_at: new Date().toISOString() })
        }
      } catch (dbErr) {
        // Non-fatal: log but don't fail the request
        console.error("[DB] Failed to persist Reddit saves:", dbErr)
      }
    }

    return NextResponse.json({
      posts: deduped,
      count: deduped.length,
      upvotesPrivate: upvoteResult.isPrivate && includeUpvoted,
      debug: {
        subredditsRequested: subreddits,
        subredditPostsFound: subredditPosts.length,
        upvotedPostsFound: upvoteResult.posts.length,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
