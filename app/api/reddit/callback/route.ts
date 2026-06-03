import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exchangeCodeForTokens } from "@/lib/reddit"
import { setRedditSession } from "@/lib/reddit-session"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const session = await auth()
  const hasXSession = !!session

  // Reddit denied access
  if (error === "access_denied") {
    const dest = hasXSession ? "/canvas?reddit=denied" : "/?reddit=denied"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // CSRF check
  const storedState = req.cookies.get("reddit_oauth_state")?.value
  if (!state || state !== storedState) {
    const dest = hasXSession ? "/canvas?reddit=error" : "/?reddit=error"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (!code) {
    const dest = hasXSession ? "/canvas?reddit=error" : "/?reddit=error"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      `${process.env.NEXTAUTH_URL}/api/reddit/callback`
    )
    await setRedditSession(tokens)

    // If user already has X session → go straight to canvas
    // If not → go back to landing page; Reddit cookie is set, X sign-in comes next
    const dest = hasXSession ? "/canvas?reddit=connected" : "/?reddit=connected"
    const response = NextResponse.redirect(new URL(dest, req.url))
    response.cookies.delete("reddit_oauth_state")
    return response
  } catch {
    const dest = hasXSession ? "/canvas?reddit=error" : "/?reddit=error"
    return NextResponse.redirect(new URL(dest, req.url))
  }
}
