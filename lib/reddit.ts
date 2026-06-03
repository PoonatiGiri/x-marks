export interface RedditSave {
  source: "reddit"
  id: string
  title: string
  body?: string
  url: string
  subreddit: string
  author: string
  score: number
  created_utc: number
  permalink: string
  is_self: boolean
  previewImage?: string
  type: "post" | "comment"
  comment_body?: string
  post_title?: string
}

export interface RedditTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  username: string
}

const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
const USER_AGENT = "web:x-marks:1.0 (by /u/x-marks-app)"

function basicAuth() {
  return Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64")
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<RedditTokens> {
  const res = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) throw new Error(`Reddit token exchange failed: ${res.status}`)

  const data = await res.json()

  // Get username
  const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `bearer ${data.access_token}`,
      "User-Agent": USER_AGENT,
    },
  })
  const me = await meRes.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    username: me.name,
  }
}

export async function refreshRedditTokens(
  refreshToken: string
): Promise<Partial<RedditTokens>> {
  const res = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error(`Reddit token refresh failed: ${res.status}`)
  const data = await res.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  }
}

export async function fetchRedditSaved(
  accessToken: string,
  username: string
): Promise<RedditSave[]> {
  const saves: RedditSave[] = []
  let after: string | null = null

  do {
    const params = new URLSearchParams({ limit: "100", type: "links" })
    if (after) params.set("after", after)

    const res = await fetch(
      `https://oauth.reddit.com/user/${username}/saved?${params}`,
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
          "User-Agent": USER_AGENT,
        },
      }
    )

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message ?? `Reddit API error: ${res.status}`)
    }

    const data = await res.json()
    const children = data?.data?.children ?? []

    for (const child of children) {
      const p = child.data
      if (child.kind === "t3") {
        // Post
        const preview =
          p.preview?.images?.[0]?.resolutions?.slice(-1)?.[0]?.url?.replace(
            /&amp;/g,
            "&"
          ) ?? (p.thumbnail?.startsWith("http") ? p.thumbnail : undefined)

        saves.push({
          source: "reddit",
          id: p.name,
          title: p.title,
          body: p.selftext || undefined,
          url: p.url,
          subreddit: p.subreddit,
          author: p.author,
          score: p.score,
          created_utc: p.created_utc,
          permalink: `https://reddit.com${p.permalink}`,
          is_self: p.is_self,
          previewImage: preview,
          type: "post",
        })
      }
    }

    after = data?.data?.after ?? null
    if (saves.length >= 500) break
  } while (after)

  return saves
}
