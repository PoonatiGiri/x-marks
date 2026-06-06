import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchSubredditTopPosts, fetchUpvotedPosts } from "@/lib/reddit"

const DB_AVAILABLE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!session.redditAccessToken || !session.redditUsername) {
    return NextResponse.json({ error: "Reddit not connected" }, { status: 401 })
  }

  const { redditAccessToken, redditUsername } = session

  const body = await req.json()
  const subreddits: string[] = body.subreddits ?? []
  const includeUpvoted: boolean = body.includeUpvoted ?? false
  const timeframe: "week" | "month" = body.timeframe ?? "week"

  try {
    const [subredditResults, upvoteResult] = await Promise.all([
      Promise.all(subreddits.map((s) => fetchSubredditTopPosts(redditAccessToken, s, timeframe))),
      includeUpvoted
        ? fetchUpvotedPosts(redditAccessToken, redditUsername)
        : Promise.resolve({ posts: [], isPrivate: false }),
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

    // Persist to DB if available — use whichever provider ID we have
    if (DB_AVAILABLE && deduped.length > 0) {
      try {
        const { getUserIdByProvider, upsertRedditSaves, setSyncState } = await import("@/lib/db")
        const provider = session.twitterId ? "twitter" : "reddit"
        const providerAccountId = session.twitterId ?? session.redditId!
        const userId = await getUserIdByProvider(provider, providerAccountId)
        if (userId) {
          await upsertRedditSaves(userId, deduped)
          await setSyncState(userId, { reddit_last_synced_at: new Date().toISOString() })
        }
      } catch (dbErr) {
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
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
