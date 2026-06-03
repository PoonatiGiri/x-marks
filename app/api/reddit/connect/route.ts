import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID!,
    response_type: "code",
    state,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/reddit/callback`,
    duration: "permanent",
    scope: "identity history mysubreddits read",
  })

  const response = NextResponse.redirect(
    `https://www.reddit.com/api/v1/authorize?${params}`
  )

  // Store state in a short-lived cookie for CSRF verification
  response.cookies.set("reddit_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  return response
}
