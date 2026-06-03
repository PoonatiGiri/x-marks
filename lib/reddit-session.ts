import { encode, decode } from "next-auth/jwt"
import { cookies } from "next/headers"
import type { RedditTokens } from "./reddit"

const COOKIE_NAME = "reddit_session"

export async function getRedditSession(): Promise<RedditTokens | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null

  try {
    const decoded = await decode({
      token: raw,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: COOKIE_NAME,
    })
    if (!decoded) return null
    return decoded as unknown as RedditTokens
  } catch {
    return null
  }
}

export async function setRedditSession(tokens: RedditTokens): Promise<void> {
  const encoded = await encode({
    token: tokens as any,
    secret: process.env.NEXTAUTH_SECRET!,
    salt: COOKIE_NAME,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearRedditSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
