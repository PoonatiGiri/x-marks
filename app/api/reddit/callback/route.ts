import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exchangeCodeForTokens } from "@/lib/reddit"
import { setRedditSession } from "@/lib/reddit-session"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error === "access_denied") {
    return NextResponse.redirect(new URL("/canvas?reddit=denied", req.url))
  }

  const storedState = req.cookies.get("reddit_oauth_state")?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/canvas?reddit=error", req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/canvas?reddit=error", req.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      `${process.env.NEXTAUTH_URL}/api/reddit/callback`
    )
    await setRedditSession(tokens)

    const response = NextResponse.redirect(
      new URL("/canvas?reddit=connected", req.url)
    )
    response.cookies.delete("reddit_oauth_state")
    return response
  } catch {
    return NextResponse.redirect(new URL("/canvas?reddit=error", req.url))
  }
}
