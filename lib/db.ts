import { getSupabase } from "./supabase"
import type { Bookmark } from "./twitter"
import type { RedditSave } from "./reddit"

// ── Bookmarks ────────────────────────────────────────────────

export async function upsertBookmarks(userId: string, bookmarks: Bookmark[]): Promise<void> {
  if (!bookmarks.length) return

  const rows = bookmarks.map((b) => ({
    id: b.id,
    user_id: userId,
    text: b.text,
    author_id: b.author_id,
    author_name: b.author_name,
    author_username: b.author_username,
    author_profile_image: b.author_profile_image ?? null,
    tweet_created_at: b.created_at,
    expanded_url: b.expanded_url ?? null,
    is_thread: b.is_thread ?? false,
    media: b.media ?? null,
    public_metrics: b.public_metrics ?? null,
    last_synced_at: new Date().toISOString(),
  }))

  const { error } = await getSupabase()
    .from("bookmarks")
    .upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: false,  // update metrics/thread status if they change
    })

  if (error) throw new Error(`DB upsert bookmarks: ${error.message}`)
}

export async function getStoredBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await getSupabase()
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("first_seen_at", { ascending: false })
    .limit(500)

  if (error) throw new Error(`DB get bookmarks: ${error.message}`)

  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    author_id: row.author_id,
    author_name: row.author_name,
    author_username: row.author_username,
    author_profile_image: row.author_profile_image ?? undefined,
    created_at: row.tweet_created_at,
    expanded_url: row.expanded_url ?? undefined,
    is_thread: row.is_thread,
    media: row.media ?? undefined,
    public_metrics: row.public_metrics ?? undefined,
  }))
}

// Returns IDs of bookmarks we already have stored
export async function getStoredBookmarkIds(userId: string): Promise<Set<string>> {
  const { data, error } = await getSupabase()
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)

  if (error) throw new Error(`DB get bookmark ids: ${error.message}`)
  return new Set((data ?? []).map((r) => r.id))
}

// ── Reddit saves ─────────────────────────────────────────────

export async function upsertRedditSaves(userId: string, posts: RedditSave[]): Promise<void> {
  if (!posts.length) return

  const rows = posts.map((p) => ({
    id: p.id,
    user_id: userId,
    title: p.title,
    body: p.body ?? null,
    url: p.url,
    subreddit: p.subreddit,
    author: p.author,
    score: p.score,
    created_utc: p.created_utc,
    permalink: p.permalink,
    is_self: p.is_self,
    preview_image: p.previewImage ?? null,
    content_type: p.contentType,
    last_synced_at: new Date().toISOString(),
  }))

  const { error } = await getSupabase()
    .from("reddit_saves")
    .upsert(rows, { onConflict: "id,user_id", ignoreDuplicates: false })

  if (error) throw new Error(`DB upsert reddit saves: ${error.message}`)
}

export async function getStoredRedditSaves(userId: string): Promise<RedditSave[]> {
  const { data, error } = await getSupabase()
    .from("reddit_saves")
    .select("*")
    .eq("user_id", userId)
    .order("first_seen_at", { ascending: false })
    .limit(500)

  if (error) throw new Error(`DB get reddit saves: ${error.message}`)

  return (data ?? []).map((row) => ({
    source: "reddit" as const,
    id: row.id,
    title: row.title,
    body: row.body ?? undefined,
    url: row.url,
    subreddit: row.subreddit,
    author: row.author,
    score: row.score,
    created_utc: row.created_utc,
    permalink: row.permalink,
    is_self: row.is_self,
    previewImage: row.preview_image ?? undefined,
    type: "post" as const,
    contentType: row.content_type as RedditSave["contentType"],
  }))
}

// ── Sync state ────────────────────────────────────────────────

export interface SyncState {
  newest_x_bookmark_id: string | null
  x_last_synced_at: string | null
  reddit_last_synced_at: string | null
}

export async function getSyncState(userId: string): Promise<SyncState | null> {
  const { data, error } = await getSupabase()
    .from("sync_state")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") throw new Error(`DB get sync state: ${error.message}`)
  return data ?? null
}

export async function setSyncState(userId: string, state: Partial<SyncState>): Promise<void> {
  const { error } = await getSupabase()
    .from("sync_state")
    .upsert({ user_id: userId, ...state }, { onConflict: "user_id" })

  if (error) throw new Error(`DB set sync state: ${error.message}`)
}

// ── User lookup ───────────────────────────────────────────────

// Get Supabase user ID from Twitter provider account ID
export async function getUserIdByTwitterId(twitterId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select("userId")
    .eq("provider", "twitter")
    .eq("providerAccountId", twitterId)
    .single()

  if (error && error.code !== "PGRST116") throw new Error(`DB get user: ${error.message}`)
  return data?.userId ?? null
}
