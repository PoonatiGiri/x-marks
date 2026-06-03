import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchAllBookmarks, fetchNewBookmarks } from "@/lib/twitter"

const DB_AVAILABLE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json({ error: "Token refresh failed — please sign in again" }, { status: 401 })
  }

  // ── Without Supabase: full fetch every time (original behaviour) ─────────
  if (!DB_AVAILABLE) {
    try {
      const { bookmarks, pages, apiTotal } = await fetchAllBookmarks(
        session.accessToken,
        session.twitterId
      )
      return NextResponse.json({ bookmarks, count: bookmarks.length, debug: { pages, apiTotal, mode: "full" } })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── With Supabase: incremental sync + serve from DB ──────────────────────
  const { getUserIdByTwitterId, getStoredBookmarks, getStoredBookmarkIds, upsertBookmarks, setSyncState } = await import("@/lib/db")

  try {
    const userId = await getUserIdByTwitterId(session.twitterId)

    // If no DB user yet (first login before adapter creates the record), fall back to full fetch
    if (!userId) {
      const { bookmarks, pages, apiTotal } = await fetchAllBookmarks(session.accessToken, session.twitterId)
      return NextResponse.json({ bookmarks, count: bookmarks.length, debug: { pages, apiTotal, mode: "full_no_user" } })
    }

    // Load stored IDs to determine what's new
    const storedIds = await getStoredBookmarkIds(userId)

    const { newBookmarks, reachedExisting } = await fetchNewBookmarks(
      session.accessToken,
      session.twitterId,
      storedIds
    )

    // Persist new bookmarks
    if (newBookmarks.length > 0) {
      await upsertBookmarks(userId, newBookmarks)
      await setSyncState(userId, {
        newest_x_bookmark_id: newBookmarks[0].id,
        x_last_synced_at: new Date().toISOString(),
      })
    }

    // Return from DB (includes preserved deleted bookmarks)
    const allBookmarks = await getStoredBookmarks(userId)

    return NextResponse.json({
      bookmarks: allBookmarks,
      count: allBookmarks.length,
      debug: {
        mode: "incremental",
        newFetched: newBookmarks.length,
        reachedExisting,
        totalStored: allBookmarks.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
