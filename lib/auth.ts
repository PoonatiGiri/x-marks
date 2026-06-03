import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"

const DB_AVAILABLE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

async function getAdapter() {
  if (!DB_AVAILABLE) return undefined
  const { SupabaseAdapter } = await import("@auth/supabase-adapter")
  return SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  })
}

async function refreshAccessToken(token: any) {
  try {
    const credentials = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64")

    const response = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID!,
      }),
    })

    const tokens = await response.json()
    if (!response.ok) throw tokens

    return {
      ...token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      error: undefined,
    }
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const }
  }
}

const adapter = await getAdapter()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Always use JWT strategy so X access token stays in the session.
  // The adapter creates user/account records in Supabase on sign-in so
  // API routes can map twitterId → Supabase user UUID via getUserIdByTwitterId().
  session: { strategy: "jwt" },
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope: "tweet.read users.read bookmark.read offline.access",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresAt: account.expires_at!,
          twitterId: account.providerAccountId,
        }
      }

      if (Date.now() < token.expiresAt * 1000) {
        return token
      }

      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.twitterId = token.twitterId
      if (token.error) session.error = token.error
      return session
    },
  },
})
