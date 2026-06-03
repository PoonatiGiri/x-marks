export interface Bookmark {
  id: string
  text: string
  author_id: string
  author_name: string
  author_username: string
  author_profile_image?: string
  created_at: string
  public_metrics?: {
    like_count: number
    retweet_count: number
    reply_count: number
    bookmark_count: number
  }
  expanded_url?: string
  is_thread?: boolean
  media?: Array<{
    type: "photo" | "video" | "animated_gif"
    url?: string
    preview_image_url?: string
  }>
}

export async function fetchAllBookmarks(
  accessToken: string,
  userId: string
): Promise<{ bookmarks: Bookmark[]; pages: number; apiTotal: number }> {
  const bookmarks: Bookmark[] = []
  let nextToken: string | undefined
  let pages = 0
  let apiTotal = 0

  do {
    const params = new URLSearchParams({
      max_results: "100",
      "tweet.fields": "created_at,public_metrics,author_id,entities,attachments,conversation_id,in_reply_to_user_id",
      expansions: "author_id,attachments.media_keys",
      "user.fields": "name,username,profile_image_url",
      "media.fields": "url,preview_image_url,type",
    })

    if (nextToken) params.set("pagination_token", nextToken)

    const res = await fetch(
      `https://api.x.com/2/users/${userId}/bookmarks?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? `X API error: ${res.status}`)
    }

    const data = await res.json()
    pages++
    apiTotal += data.meta?.result_count ?? 0

    if (data.data?.length) {
      const usersMap: Record<string, any> = Object.fromEntries(
        (data.includes?.users ?? []).map((u: any) => [u.id, u])
      )
      const mediaMap: Record<string, any> = Object.fromEntries(
        (data.includes?.media ?? []).map((m: any) => [m.media_key, m])
      )

      for (const tweet of data.data) {
        const author = usersMap[tweet.author_id] ?? {}
        const firstUrl = tweet.entities?.urls?.find(
          (u: any) => !u.expanded_url?.includes("t.co")
        )?.expanded_url ?? tweet.entities?.urls?.[0]?.expanded_url

        const media = (tweet.attachments?.media_keys ?? [])
          .map((key: string) => mediaMap[key])
          .filter(Boolean)
          .map((m: any) => ({
            type: m.type,
            url: m.url,
            preview_image_url: m.preview_image_url,
          }))

        bookmarks.push({
          id: tweet.id,
          text: tweet.text,
          author_id: tweet.author_id,
          author_name: author.name ?? "Unknown",
          author_username: author.username ?? "unknown",
          author_profile_image: author.profile_image_url,
          created_at: tweet.created_at,
          public_metrics: tweet.public_metrics,
          expanded_url: firstUrl,
          is_thread: tweet.in_reply_to_user_id === tweet.author_id,
          media: media.length ? media : undefined,
        })
      }
    }

    nextToken = data.meta?.next_token

    // Safety cap at 500 for initial load
    if (bookmarks.length >= 500) break
  } while (nextToken)

  return { bookmarks, pages, apiTotal }
}
