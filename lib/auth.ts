import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"
import Reddit from "next-auth/providers/reddit"
import type { JWT } from "next-auth/jwt"

export const DB_AVAILABLE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

async function getAdapter() {
  if (!DB_AVAILABLE) return undefined
  const { SupabaseAdapter } = await import("@auth/supabase-adapter")
  return SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  })
}

// ── Token refresh helpers ────────────────────────────────────────────────────

async function refreshXToken(token: JWT): Promise<JWT> {
  try {
    const credentials = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64")

    const res = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.xRefreshToken!,
        client_id: process.env.TWITTER_CLIENT_ID!,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw data

    return {
      ...token,
      xAccessToken: data.access_token,
      xRefreshToken: data.refresh_token ?? token.xRefreshToken,
      xExpiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      error: undefined,
    }
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const }
  }
}

async function refreshRedditToken(token: JWT): Promise<JWT> {
  try {
    const credentials = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64")

    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
        "User-Agent": "web:x-marks:1.0",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.redditRefreshToken!,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw data

    return {
      ...token,
      redditAccessToken: data.access_token,
      redditRefreshToken: data.refresh_token ?? token.redditRefreshToken,
      redditExpiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      error: undefined,
    }
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const }
  }
}

// ── Auth config ──────────────────────────────────────────────────────────────

const adapter = await getAdapter()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Always JWT so tokens stay in the session regardless of adapter
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
    Reddit({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      // Explicit URL required — the built-in provider stores its default as a
      // plain string, so providing only `params` loses the URL on merge.
      authorization: {
        url: "https://www.reddit.com/api/v1/authorize",
        params: {
          scope: "identity history mysubreddits read",
          duration: "permanent",
          response_type: "code",
        },
      },
      // Reddit token endpoint requires HTTP Basic Auth (client_secret_basic),
      // not body params (client_secret_post) which is NextAuth's default.
      token: {
        url: "https://www.reddit.com/api/v1/access_token",
        async request({ provider, params }: { provider: any; params: any }) {
          const credentials = Buffer.from(
            `${provider.clientId}:${provider.clientSecret}`
          ).toString("base64")

          const res = await fetch("https://www.reddit.com/api/v1/access_token", {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "web:x-marks:1.0",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: String(params.code),
              redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/reddit`,
            }),
          })

          if (!res.ok) {
            const err = await res.text()
            throw new Error(`Reddit token exchange failed (${res.status}): ${err}`)
          }

          const tokens = await res.json()
          return { tokens }
        },
      },
      // Reddit requires a User-Agent header — NextAuth doesn't send one by default.
      userinfo: {
        url: "https://oauth.reddit.com/api/v1/me",
        async request({ tokens }: { tokens: any }) {
          const res = await fetch("https://oauth.reddit.com/api/v1/me", {
            headers: {
              Authorization: `bearer ${tokens.access_token}`,
              "User-Agent": "web:x-marks:1.0",
            },
          })
          if (!res.ok) throw new Error(`Reddit userinfo failed (${res.status})`)
          return res.json()
        },
      },
      // Map Reddit profile → NextAuth user
      profile(profile: any) {
        return {
          id: profile.name,
          name: profile.name,
          email: profile.email ?? null,
          image: profile.icon_img?.split("?")?.[0] ?? null,
        }
      },
    }),
  ],

  callbacks: {
    // ── signIn ─────────────────────────────────────────────────────────────
    // Decides whether to allow sign-in and where to redirect.
    // Handles: email-based auto-linking and intent-gate routing.
    async signIn({ user, account, profile }) {
      if (!account) return true

      // ── Without DB: allow everything, no duplicate detection ────────────
      if (!DB_AVAILABLE) return true

      // ── Check if the user is already signed in (in-canvas linking case) ─
      // Read the existing NextAuth JWT cookie to detect an active session.
      try {
        const { decode } = await import("next-auth/jwt")
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        const raw =
          cookieStore.get("authjs.session-token")?.value ??
          cookieStore.get("__Secure-authjs.session-token")?.value

        if (raw) {
          const existing = await decode({
            token: raw,
            secret: process.env.NEXTAUTH_SECRET!,
            salt: "authjs.session-token",
          })
          if (existing?.sub) {
            // Active session — treat this as a link, not a new sign-in.
            // Preserve the existing user ID so the adapter links accounts.
            user.id = existing.sub
            return true
          }
        }
      } catch {
        // Cookie unreadable — proceed normally
      }

      // ── Email-based auto-linking ────────────────────────────────────────
      // Reddit sometimes returns an email; X doesn't (email scope not approved).
      // If the incoming provider does supply an email that matches an existing
      // user, link automatically rather than showing the intent gate.
      if (user.email) {
        try {
          const { getSupabase } = await import("@/lib/supabase")
          const db = getSupabase()
          const { data: existingUser } = await db
            .from("users")
            .select("id")
            .eq("email", user.email)
            .maybeSingle()

          if (existingUser) {
            // Same email found — link to existing user
            user.id = existingUser.id
            return true
          }
        } catch {
          // DB lookup failed — fall through to intent gate
        }
      }

      // ── Intent gate for genuine fragmentation risk only ─────────────────
      // Only fire when there's a user who has the OTHER platform but hasn't
      // linked THIS one yet. That's the only scenario where a new sign-in
      // could be an accidental duplicate of an existing account.
      //
      // Examples of when gate fires:
      //   - User 1 has X only → new sign-in with Reddit → gate (could be User 1)
      //   - User 1 has Reddit only → new sign-in with X → gate (could be User 1)
      //
      // Examples where gate does NOT fire:
      //   - Empty DB → definitely a new user → no gate
      //   - All existing users already have both platforms linked → no gate
      //   - Only users with the SAME provider exist → no gate (new user)
      try {
        const { getSupabase } = await import("@/lib/supabase")
        const db = getSupabase()
        const otherProvider = account.provider === "twitter" ? "reddit" : "twitter"

        // Step 1: find all user IDs that have the OTHER provider
        const { data: othersData } = await db
          .from("accounts")
          .select("userId")
          .eq("provider", otherProvider)

        const otherProviderUserIds = (othersData ?? []).map((r: any) => r.userId as string)

        if (otherProviderUserIds.length > 0) {
          // Step 2: of those, find which ones already have THIS provider linked
          const { data: currentData } = await db
            .from("accounts")
            .select("userId")
            .eq("provider", account.provider)
            .in("userId", otherProviderUserIds)

          const alreadyLinked = new Set((currentData ?? []).map((r: any) => r.userId as string))

          // If any user has the other platform but NOT this one → risk of fragmentation
          const hasUnlinkedUser = otherProviderUserIds.some((id) => !alreadyLinked.has(id))

          if (hasUnlinkedUser) {
            return `/link?provider=${account.provider}&newUser=true`
          }
        }
      } catch {
        // DB lookup failed — proceed without gate
      }

      return true
    },

    // ── jwt ────────────────────────────────────────────────────────────────
    // Runs on every request. On new sign-in (account present), we recover the
    // other provider's tokens from two sources:
    //   1. Existing session cookie — for in-session linking (user adds second
    //      platform without signing out first).
    //   2. Supabase accounts table — for cross-session persistence (user signed
    //      out and back in; both providers are linked in DB but JWT is fresh).
    // Without source 2, signing out and back in drops the second platform.
    async jwt({ token, account, profile }) {
      // ── New sign-in or account linking ───────────────────────────────────
      if (account) {
        // ── Three sources for the other provider's tokens ─────────────────────
        // Priority (highest → lowest): DB > session cookie > persisted cookie
        //
        // Source 1 — existing session cookie (in-session linking, no sign-out)
        // Source 2 — Supabase accounts table (survives sign-out, requires DB)
        // Source 3 — xmarks.linked-tokens cookie (survives sign-out, no DB needed)
        //
        // Source 3 is written any time both providers are connected and is the
        // fallback when DB is not configured.

        // ── Source 1: existing session cookie ────────────────────────────────
        let existing: Partial<JWT> = {}
        try {
          const { decode } = await import("next-auth/jwt")
          const { cookies } = await import("next/headers")
          const cookieStore = await cookies()
          const raw =
            cookieStore.get("authjs.session-token")?.value ??
            cookieStore.get("__Secure-authjs.session-token")?.value
          if (raw) {
            const decoded = await decode({
              token: raw,
              secret: process.env.NEXTAUTH_SECRET!,
              salt: "authjs.session-token",
            })
            if (decoded) existing = decoded as Partial<JWT>
          }
        } catch {
          // Cookie unreadable — proceed without
        }

        // ── Source 2: Supabase accounts table ────────────────────────────────
        let dbTokens: Partial<JWT> = {}
        if (DB_AVAILABLE) {
          try {
            const { getSupabase } = await import("@/lib/supabase")
            const db = getSupabase()
            const otherProvider = account.provider === "twitter" ? "reddit" : "twitter"

            const { data: thisAcc } = await db
              .from("accounts")
              .select("userId")
              .eq("provider", account.provider)
              .eq("providerAccountId", account.providerAccountId)
              .maybeSingle()

            if (thisAcc?.userId) {
              const { data: otherAcc } = await db
                .from("accounts")
                .select("access_token, refresh_token, expires_at, providerAccountId")
                .eq("provider", otherProvider)
                .eq("userId", thisAcc.userId)
                .maybeSingle()

              if (otherAcc?.access_token) {
                if (otherProvider === "reddit") {
                  dbTokens = {
                    redditAccessToken: otherAcc.access_token ?? undefined,
                    redditRefreshToken: otherAcc.refresh_token ?? undefined,
                    redditExpiresAt: (otherAcc.expires_at as number | null) ?? Math.floor(Date.now() / 1000) - 1,
                    redditId: otherAcc.providerAccountId,
                    redditUsername: otherAcc.providerAccountId,
                  }
                } else {
                  dbTokens = {
                    xAccessToken: otherAcc.access_token ?? undefined,
                    xRefreshToken: otherAcc.refresh_token ?? undefined,
                    xExpiresAt: (otherAcc.expires_at as number | null) ?? Math.floor(Date.now() / 1000) - 1,
                    twitterId: otherAcc.providerAccountId,
                  }
                }
              }
            }
          } catch (e) {
            console.error("[Auth] DB linked account lookup failed:", e)
          }
        }

        // ── Source 3: xmarks.linked-tokens persistent cookie ─────────────────
        // Written any time both providers are connected (see below).
        // Survives sign-out because it's a separate cookie from authjs.session-token.
        let persistedTokens: Partial<JWT> = {}
        try {
          const { decode: jwtDecode } = await import("next-auth/jwt")
          const { cookies: getCookies } = await import("next/headers")
          const cookieStore = await getCookies()
          const raw = cookieStore.get("xmarks.linked-tokens")?.value
          if (raw) {
            const decoded = await jwtDecode({
              token: raw,
              secret: process.env.NEXTAUTH_SECRET!,
              salt: "xmarks.linked-tokens",
            })
            if (decoded) persistedTokens = decoded as Partial<JWT>
          }
        } catch {
          // Cookie unreadable — proceed without
        }

        // ── Build merged return token ─────────────────────────────────────────
        // DB > session cookie > persisted cookie (each fallback fills gaps)
        let resultToken: JWT

        if (account.provider === "twitter") {
          const hasReddit = !!(
            dbTokens.redditAccessToken ??
            existing.redditAccessToken ??
            persistedTokens.redditAccessToken
          )
          resultToken = {
            ...token,
            redditAccessToken: dbTokens.redditAccessToken ?? existing.redditAccessToken ?? persistedTokens.redditAccessToken,
            redditRefreshToken: dbTokens.redditRefreshToken ?? existing.redditRefreshToken ?? persistedTokens.redditRefreshToken,
            redditExpiresAt: dbTokens.redditExpiresAt ?? existing.redditExpiresAt ?? persistedTokens.redditExpiresAt,
            redditId: dbTokens.redditId ?? existing.redditId ?? persistedTokens.redditId,
            redditUsername: dbTokens.redditUsername ?? existing.redditUsername ?? persistedTokens.redditUsername,
            xAccessToken: account.access_token!,
            xRefreshToken: account.refresh_token!,
            xExpiresAt: account.expires_at as number,
            twitterId: account.providerAccountId,
            providers: unique(["twitter" as const, ...(hasReddit ? ["reddit" as const] : [])]),
          }
        } else if (account.provider === "reddit") {
          const hasX = !!(
            dbTokens.xAccessToken ??
            existing.xAccessToken ??
            persistedTokens.xAccessToken
          )
          resultToken = {
            ...token,
            xAccessToken: dbTokens.xAccessToken ?? existing.xAccessToken ?? persistedTokens.xAccessToken,
            xRefreshToken: dbTokens.xRefreshToken ?? existing.xRefreshToken ?? persistedTokens.xRefreshToken,
            xExpiresAt: dbTokens.xExpiresAt ?? existing.xExpiresAt ?? persistedTokens.xExpiresAt,
            twitterId: dbTokens.twitterId ?? existing.twitterId ?? persistedTokens.twitterId,
            redditAccessToken: account.access_token!,
            redditRefreshToken: account.refresh_token!,
            redditExpiresAt: account.expires_at
              ? (account.expires_at as number)
              : Math.floor(Date.now() / 1000) + 3600,
            redditId: account.providerAccountId,
            redditUsername: (profile as any)?.name ?? "",
            providers: unique(["reddit" as const, ...(hasX ? ["twitter" as const] : [])]),
          }
        } else {
          return token
        }

        // ── Write / refresh the persistent cookie ────────────────────────────
        // Written whenever both providers are connected so the cookie always
        // has the freshest tokens. Runs in the OAuth callback Route Handler
        // context where cookies().set() is permitted.
        if (resultToken.xAccessToken && resultToken.redditAccessToken) {
          try {
            const { encode: jwtEncode } = await import("next-auth/jwt")
            const { cookies: getCookies } = await import("next/headers")
            const cookieStore = await getCookies()
            const encoded = await jwtEncode({
              token: {
                xAccessToken: resultToken.xAccessToken,
                xRefreshToken: resultToken.xRefreshToken,
                xExpiresAt: resultToken.xExpiresAt,
                twitterId: resultToken.twitterId,
                redditAccessToken: resultToken.redditAccessToken,
                redditRefreshToken: resultToken.redditRefreshToken,
                redditExpiresAt: resultToken.redditExpiresAt,
                redditId: resultToken.redditId,
                redditUsername: resultToken.redditUsername,
              } as any,
              secret: process.env.NEXTAUTH_SECRET!,
              salt: "xmarks.linked-tokens",
              maxAge: 60 * 60 * 24 * 90, // 90 days
            })
            cookieStore.set("xmarks.linked-tokens", encoded, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 90,
              path: "/",
            })
          } catch {
            // Not in Route Handler context (e.g. Server Component auth() call) — skip
          }
        }

        return resultToken
      }

      // ── Subsequent requests: refresh expired tokens ───────────────────────
      const now = Math.floor(Date.now() / 1000)

      if (token.xExpiresAt && now >= token.xExpiresAt - 60) {
        token = await refreshXToken(token)
      }

      if (token.redditExpiresAt && now >= token.redditExpiresAt - 60) {
        token = await refreshRedditToken(token)
      }

      return token
    },

    // ── session ────────────────────────────────────────────────────────────
    async session({ session, token }) {
      // X fields
      session.xAccessToken = token.xAccessToken
      session.twitterId = token.twitterId
      // Reddit fields
      session.redditAccessToken = token.redditAccessToken
      session.redditUsername = token.redditUsername
      session.redditId = token.redditId
      // Connected platforms list (drives UI)
      session.providers = token.providers ?? []
      // Pass through any error
      if (token.error) session.error = token.error
      return session
    },
  },

  pages: {
    // Custom sign-in page — use landing page as the sign-in UI
    signIn: "/",
  },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}
