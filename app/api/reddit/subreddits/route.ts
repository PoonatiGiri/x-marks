import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchSubscribedSubreddits } from "@/lib/reddit"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!session.redditAccessToken) {
    return NextResponse.json({ error: "Reddit not connected" }, { status: 401 })
  }

  try {
    const subreddits = await fetchSubscribedSubreddits(session.redditAccessToken)
    return NextResponse.json({ subreddits })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
