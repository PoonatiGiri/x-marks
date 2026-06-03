import { NextRequest, NextResponse } from "next/server"
import { getRedditSession, setRedditSession } from "@/lib/reddit-session"
import { refreshRedditTokens } from "@/lib/reddit"

const USER_AGENT = "web:x-marks:1.0 (by /u/x-marks-app)"

export interface RedditComment {
  id: string
  author: string
  body: string
  score: number
  created_utc: number
  depth: number
  replies: RedditComment[]
}

function parseComments(children: any[], depth = 0): RedditComment[] {
  const out: RedditComment[] = []
  for (const child of children) {
    if (child.kind !== "t1") continue
    const d = child.data
    out.push({
      id: d.id,
      author: d.author,
      body: d.body,
      score: d.score,
      created_utc: d.created_utc,
      depth,
      replies: d.replies?.data?.children
        ? parseComments(d.replies.data.children, depth + 1)
        : [],
    })
  }
  return out
}

export async function POST(req: NextRequest) {
  const { permalink } = await req.json()
  if (!permalink) return NextResponse.json({ error: "Missing permalink" }, { status: 400 })

  let tokens = await getRedditSession()
  if (!tokens) return NextResponse.json({ error: "Not connected to Reddit" }, { status: 401 })

  // Auto-refresh token
  if (Date.now() / 1000 > tokens.expires_at - 60) {
    try {
      const refreshed = await refreshRedditTokens(tokens.refresh_token)
      tokens = { ...tokens, ...refreshed }
      await setRedditSession(tokens)
    } catch {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }
  }

  // Strip domain if full URL, get just the path
  const path = permalink.replace(/^https?:\/\/(www\.)?reddit\.com/, "").replace(/\/?$/, "")

  const res = await fetch(
    `https://oauth.reddit.com${path}.json?limit=50&depth=4&sort=top`,
    {
      headers: {
        Authorization: `bearer ${tokens.access_token}`,
        "User-Agent": USER_AGENT,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `Reddit API error: ${res.status}` }, { status: 500 })
  }

  const data = await res.json()
  const comments = parseComments(data[1]?.data?.children ?? [])

  return NextResponse.json({ comments })
}
