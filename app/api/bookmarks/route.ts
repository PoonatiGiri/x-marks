import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchAllBookmarks } from "@/lib/twitter"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json({ error: "Token refresh failed — please sign in again" }, { status: 401 })
  }

  try {
    const { bookmarks, pages, apiTotal } = await fetchAllBookmarks(session.accessToken, session.twitterId)
    return NextResponse.json({ bookmarks, count: bookmarks.length, debug: { pages, apiTotal } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
