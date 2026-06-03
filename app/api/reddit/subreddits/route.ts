import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchSubscribedSubreddits, refreshRedditTokens } from "@/lib/reddit"
import { getRedditSession, setRedditSession } from "@/lib/reddit-session"

export async function GET() {
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

  try {
    const subreddits = await fetchSubscribedSubreddits(access_token)
    return NextResponse.json({ subreddits })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
