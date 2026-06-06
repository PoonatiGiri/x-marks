import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchRedditSaved } from "@/lib/reddit"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!session.redditAccessToken || !session.redditUsername) {
    return NextResponse.json({ error: "Reddit not connected", connected: false }, { status: 401 })
  }

  try {
    // Token refresh is handled automatically by the JWT callback before this runs
    const saves = await fetchRedditSaved(session.redditAccessToken, session.redditUsername)
    return NextResponse.json({ saves, count: saves.length, username: session.redditUsername })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
