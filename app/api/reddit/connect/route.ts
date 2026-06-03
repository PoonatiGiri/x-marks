import { NextResponse } from "next/server"

export async function GET() {
  // No X session required — Reddit can be connected before or after X sign-in.
  // After OAuth, if no X session, callback redirects back to landing page.
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
