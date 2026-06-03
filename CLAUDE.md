# X-marks — Project Context for Claude

## What This Product Is

X-marks is a paid SaaS ($9.99/month) that pulls a user's saved content from social platforms and displays it on an **infinite canvas** — so they can actually revisit, rediscover, and use what they've saved instead of letting it rot in a list.

**Core insight:** People save content compulsively (Twitter bookmarks, Reddit saves) but never return to it. The canvas format + AI surfacing (planned) makes rediscovery frictionless.

**Target user:** "Curious professionals" — indie hackers, founders, PMs, designers, knowledge workers. People who already pay for Notion, Readwise, Linear. High intent, low CAC (find tools via Twitter/HN/Product Hunt).

**Positioning:** "Your saved content, finally useful."
vs competitors: X charges $8/month just for folders. X-marks gives canvas + cross-platform + content preservation + search for $9.99.

---

## Current State (what's built and working)

### ✅ Working
- **X OAuth 2.0 login** via NextAuth v5 with auto token refresh
- **X bookmarks fetch** — cursor-paginated, up to 500, with images/media
- **Thread detection** — `is_thread: true` when tweet is a self-reply (author replied to themselves). Shows purple "Thread" badge on card.
- **Infinite canvas** using `@xyflow/react` — pan, zoom, drag nodes. Clean 8-column grid (no jitter).
- **Reddit OAuth** — secondary account, stored in encrypted HTTP-only cookie (separate from NextAuth session)
- **Reddit connect from landing page** — Reddit OAuth no longer requires X session first. Works both before and after X login.
- **Reddit subreddit selector** — user picks communities, we pull top posts (week/month)
- **Reddit upvoted posts** — fetched if user has public vote history
- **Reddit content manager** — "Manage Reddit" button in toolbar to update subreddit selections
- **Reddit setup modal** — only auto-opens immediately after Reddit OAuth (`?reddit=connected`). Does NOT auto-open on every page load.
- **Reddit comments panel** — click any Reddit card → slide-in panel with top comments (depth 4, sorted by top). Collapsible threads.
- **Article reader panel** — click X card (if has URL) or Reddit link post → slide-in panel with extracted article content via `@extractus/article-extractor`
- **Source filter** — All / X / Reddit tabs in toolbar
- **Keyword search** — live filter bar (Cmd+K to focus). Searches tweet text/author + Reddit title/subreddit/body. ESC to clear.
- **ESC key** — closes open panel first, then clears search on second press
- **Sync button** — manual refresh
- **Cards** — X cards (white, Thread badge if applicable) and Reddit cards (orange accent). Click hint at bottom.
- **Supabase persistence layer** — code complete, activated by env vars (see below). Incremental sync + content preservation.
- **Landing page** — "Your saved content, finally useful." with animated marquee background (inclined rows of X/Reddit cards moving in alternating directions). Both "Continue with X" and "Connect Reddit" buttons.

### 🔴 Not Built Yet (critical before paying users)
- **Supabase env vars** — code is done, but `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` not set in `.env.local`. App runs in no-DB mode.
- **Stripe payments** — no payment flow yet
- **Trial expiry logic** — 14-day trial counter (needs Supabase active)
- **Background auto-sync** (6hr Vercel cron) — no cron jobs yet
- **Vercel deployment** — app not yet live

### 🟡 Planned (Phase 2)
- Weekly digest email (top retention mechanic)
- AI semantic search across bookmarks
- Tags and collections
- Public canvas sharing
- Annual plan ($79/year)
- Account linking UI (connect both X and Reddit to same account)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Canvas | `@xyflow/react` v12 |
| Auth | NextAuth v5 (beta) — X OAuth 2.0 |
| Reddit auth | Custom OAuth flow, tokens in encrypted cookie |
| Database | Supabase — code ready, needs env vars |
| Payments | Not added yet — plan is Stripe |
| Hosting | Not deployed yet — plan is Vercel |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |

---

## File Structure

```
app/
  api/
    auth/[...nextauth]/     NextAuth handler
    bookmarks/              GET — X bookmarks (incremental sync if DB available, full fetch if not)
    extract/                POST { url } — article extraction via @extractus/article-extractor
    reddit/
      connect/              GET — start Reddit OAuth (no X session required)
      callback/             GET — complete Reddit OAuth; redirects to /canvas or / depending on X session
      saved/                GET — check Reddit connection + fetch saved posts
      subreddits/           GET — fetch subscribed subreddits (throws on error, no silent empty)
      feed/                 POST — fetch top posts from selected subreddits + upvotes; persists to DB if available
      comments/             POST { permalink } — fetch post comments from Reddit API
  canvas/                   Protected canvas page
  page.tsx                  Landing page — marquee background, X + Reddit auth buttons

components/
  canvas/
    BookmarkCanvas.tsx      Main canvas — fetches data, manages state, search, panels
    BookmarkNode.tsx        X bookmark card (Thread badge, article click handler)
    RedditNode.tsx          Reddit post card (comments/article click handler, external link icon)
    RedditSetup.tsx         Subreddit selector modal (first setup + manage). Shows real error if subreddits fail to load.
    CommentsPanel.tsx       Slide-in panel — Reddit comments with collapsible threads
    ArticlePanel.tsx        Slide-in panel — extracted article content (prose rendering)
  landing/
    MarqueeBackground.tsx   Animated inclined card rows for landing page background
  providers.tsx             SessionProvider wrapper

lib/
  auth.ts                   NextAuth config + X token refresh + optional Supabase adapter
  twitter.ts                X API — fetchAllBookmarks() + fetchNewBookmarks() (incremental)
  reddit.ts                 Reddit API — fetch saved, subreddits, top posts, upvoted, refresh tokens
  reddit-session.ts         Reddit token cookie helpers (encode/decode with NEXTAUTH_SECRET)
  supabase.ts               Lazy Supabase client singleton (server-side only, service role)
  db.ts                     DB operations — upsert/query bookmarks, reddit_saves, sync_state; getUserIdByTwitterId()

supabase/
  migrations/
    001_initial.sql         Full schema — NextAuth tables + bookmarks + reddit_saves + sync_state + RLS

types/
  next-auth.d.ts            Session/JWT type augmentation
```

---

## Key Technical Decisions & Gotchas

### X API
- **Cost:** $0.001 per bookmark (owned reads). No free tier — pure pay-per-use credits.
- **Rate limits:** Per user token (180 req/15min). Scales naturally with users.
- **Bookmarks endpoint:** `GET /2/users/{id}/bookmarks` — requires `bookmark.read`, `tweet.read`, `users.read`, `offline.access` scopes
- **Tweet fields fetched:** `created_at, public_metrics, author_id, entities, attachments, conversation_id, in_reply_to_user_id`
- **Thread detection:** `is_thread = (tweet.in_reply_to_user_id === tweet.author_id)` — self-reply = thread
- **Content fragility:** API omits bookmarks from deleted tweets. In one real test, 192 UI bookmarks → 94 API results (~98 deleted). Supabase content preservation fixes this.
- **Token expiry:** Access tokens last 2 hours. Refresh happens in `lib/auth.ts` JWT callback.

### Reddit API
- **Registration required:** Reddit now requires API registration even for free tier. A support request was submitted.
- **Temporary credentials:** Using existing "peersupport" app credentials for testing. Client ID and Secret are in `.env.local`.
- **Free tier is non-commercial only.** For a paid product, Reddit requires a formal commercial contract (~$0.24/1,000 calls). Don't launch Reddit feature to paying users without this.
- **Subreddit top posts are FREE** — public endpoint, no per-request cost regardless of tier.
- **Upvoted posts:** API returns empty if user hasn't made vote history public in Reddit settings.
- **OAuth scope:** `identity history mysubreddits read`
- **Tokens stored:** In an HTTP-only cookie `reddit_session`, encrypted with NEXTAUTH_SECRET.
- **Comments:** `POST /api/reddit/comments` → `GET https://oauth.reddit.com{permalink}.json?limit=50&depth=4&sort=top`
- **fetchSubscribedSubreddits throws on error** — was previously silently returning `[]`; now throws so the UI shows the real error and a "Reconnect Reddit" link.

### Reddit Preferences
- **Stored in:** `localStorage` as `xmarks_reddit_prefs` (JSON). Will move to Supabase.
- **Schema:** `{ subreddits: string[], includeUpvoted: boolean, timeframe: "week" | "month" }`

### Canvas Layout
- **8 columns, 300px card width, 60px gaps** — clean grid, no jitter
- `defaultViewport={{ x: 60, y: 60, zoom: 0.55 }}` — no fitView (fitView at 191 items zooms to 0.05x)
- Card positions: deterministic grid, no random offset
- Nodes keyed by bookmark/post ID — React Flow deduplicates

### Search
- Client-side live filter on `filteredItems` (memoized)
- Searches: tweet text, author name, author username; Reddit title, subreddit, author, body
- Cmd+K to focus; ESC to clear; "No results for X" empty state shown in canvas

### Side Panels
- Single `PanelState` in BookmarkCanvas: `{ type: "comments", post } | { type: "article", url, title } | null`
- Reddit text posts → CommentsPanel; Reddit link posts → ArticlePanel; X cards with URL → ArticlePanel
- Panels are `absolute top-0 right-0 h-full w-[380-420px]` positioned over canvas
- ESC closes panel

### Auth Architecture

**X (primary identity)**
- NextAuth v5, JWT strategy always (even with Supabase adapter — ensures X access token stays in session)
- `lib/auth.ts` has `DB_AVAILABLE` check — if Supabase env vars present, adds SupabaseAdapter (creates user/account records in DB)
- Access token (2hr) + refresh token in JWT. Auto-refreshed in `jwt` callback.
- `session.twitterId` = X provider account ID (used to look up Supabase UUID via `getUserIdByTwitterId()`)

**Reddit (secondary account)**
- Custom OAuth flow, independent of NextAuth
- Tokens in HTTP-only cookie `reddit_session`, encrypted with NEXTAUTH_SECRET
- Reddit OAuth can now start **without** X session:
  - X session exists at callback → redirect to `/canvas?reddit=connected`
  - No X session at callback → redirect to `/?reddit=connected` (tokens stored; user signs in with X next, Reddit cookie already there)

### Supabase Persistence Layer
- **Schema:** `supabase/migrations/001_initial.sql` — run once in Supabase SQL editor
- **Activation:** add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. App detects and switches modes.
- **Graceful degradation:** all DB code is behind `DB_AVAILABLE` check. Without env vars, full fetch every load (original behaviour).
- **Incremental sync:** `fetchNewBookmarks()` stops fetching X API pages once it hits a tweet ID already in DB. Only new bookmarks are fetched and upserted.
- **Content preservation:** deleted tweets remain in DB with their text. Canvas serves from DB, not from live API.
- **Reddit saves:** persisted after each feed fetch (non-fatal if it fails — doesn't block the response).
- **User lookup:** `getUserIdByTwitterId(twitterId)` maps X provider ID → Supabase UUID. Used in all API routes that write to DB.

### Landing Page Background
- 4 rows of fake-but-realistic X tweet and Reddit post cards
- Rows move horizontally at -12° inclination, alternating directions, staggered speeds (35–50s)
- Pure CSS `@keyframes marquee` + `marquee-reverse` — no JS
- Cards duplicated in DOM for seamless infinite loop
- White radial vignette (75% ellipse, 62% solid white center) + top/bottom fade keeps CTA readable
- `slate-50` backdrop gives white card backgrounds visible contrast

---

## Environment Variables

```
NEXTAUTH_SECRET=          # openssl rand -base64 32
TWITTER_CLIENT_ID=        # developer.x.com
TWITTER_CLIENT_SECRET=    # developer.x.com
REDDIT_CLIENT_ID=         # reddit.com/prefs/apps (currently "peersupport" app for testing)
REDDIT_CLIENT_SECRET=     # reddit.com/prefs/apps
NEXTAUTH_URL=             # http://localhost:3001 (dev) or https://yourdomain.com (prod)

# Supabase — add these to activate persistence + incremental sync
# 1. Create project at supabase.com
# 2. Run supabase/migrations/001_initial.sql in the SQL editor
# 3. Add these two vars — app auto-detects and switches modes
SUPABASE_URL=             # https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY= # eyJ... (Settings > API > service_role key)
```

---

## Build Milestones

### Session 1 — Core MVP
- Scaffolded Next.js 16 project
- X OAuth 2.0 via NextAuth v5 — login, token refresh, session
- X bookmarks API with cursor pagination + media
- Infinite canvas with `@xyflow/react` — BookmarkNode cards, pan/zoom, minimap
- Manual sync button

### Session 2 — Reddit Integration
- Reddit OAuth flow (cookie-based, secondary to X)
- Reddit subreddit selector, top posts feed, upvoted posts
- Reddit content manager ("Manage Reddit" in toolbar)
- Source filter tabs: All / X / Reddit
- Fixed canvas zoom (8 cols, `defaultViewport`)
- Pushed to GitHub

### Session 3 — Interactivity
- **Reddit comments panel** — click Reddit card → slide-in comments with collapsible threads
- **Article extraction panel** — click X/Reddit card with URL → extracted article reader
- **Thread detection** — `is_thread` badge on X cards that are self-reply threads
- **Search bar** — Cmd+K, live client-side filter across all cards
- **Stable card grid** — removed Math.random() jitter, clean 8-column layout (jitter was previously random and caused cards to jump on re-render)
- **ESC key** — closes panel / clears search
- **Landing page refresh** — new headline, feature pills
- **@tailwindcss/typography** — for article prose rendering

### Session 4 — Persistence + Auth
- **Supabase persistence layer** — full schema (`001_initial.sql`), `lib/supabase.ts`, `lib/db.ts`, incremental sync, content preservation
- **Reddit setup modal fix** — no longer auto-opens on every login; only after `?reddit=connected` redirect
- **Reddit errors surfaced** — `fetchSubscribedSubreddits` throws on non-2xx; RedditSetup shows error + Reconnect link
- **Reddit on landing page** — "Connect Reddit" button alongside "Continue with X"
- **Reddit OAuth edge case** — Reddit can be connected before X auth; callback handles both flows
- **Landing page marquee background** — animated inclined card rows

---

## Key Decisions Made (and why)

### Product
| Decision | What was decided | Why |
|----------|-----------------|-----|
| ToS risk | Accept and build | Start small, X hasn't targeted bookmark tools |
| Pricing | $9.99/month | Target users pay $8–30/month for tools |
| Free tier | No free tier — 14-day trial | API costs stack up even for free users |
| Annual plan | $79/year planned | Retention + upfront cash |
| Reddit content | Subreddit top posts, not just saves | Most users have 0 Reddit saves; top posts give value on day 1 |
| Platform scope | X + Reddit only for now | LinkedIn/Instagram APIs locked for personal saved data |

### Technical
| Decision | What was decided | Why |
|----------|-----------------|-----|
| Reddit auth | Cookie-based (not NextAuth) | Keeps X as primary identity; no Supabase required for basic flow |
| Canvas zoom | `defaultViewport` not `fitView` | fitView at 191 items zooms to 0.05x — unreadable |
| Canvas jitter | Removed entirely | Clean grid reads better; jitter added noise without benefit |
| JWT strategy | Always JWT (even with adapter) | Database sessions would lose X access token from session |
| DB activation | Feature-flagged via env var check | App works identically without Supabase keys |
| Incremental sync | Stop at first known ID | X API returns newest first; no need to scan full history every time |

---

## OAuth Edge Case: Duplicate Accounts

**The problem:** User signs in with X → has account. Later accidentally uses "Connect Reddit" on landing page as if it were a sign-in → creates confusion.

**What was discussed:** Three options:
1. Email-based auto-link — unreliable (Reddit/X often don't expose email)
2. "Is this a new account?" prompt after OAuth — catches most cases
3. "Link accounts" in Settings — self-serve merge

**Decision:** Deferred until Supabase is active. For now, landing page copy guides users clearly. At small scale, manual merge in Supabase if needed.

---

## Explicitly Deferred (don't re-raise without reason)

| What | Why deferred | When to revisit |
|------|-------------|-----------------|
| Activate Supabase | Needs project setup + env vars | Next session — just plug in credentials |
| Incremental sync (live) | Supabase code built, not activated | After Supabase env vars added |
| Stripe payments | No product to charge for yet | After Supabase active |
| Trial expiry logic | Needs user records in Supabase | After Supabase active |
| OAuth duplicate account UI | Low frequency, manageable via support | When Supabase is added |
| Reddit commercial contract | Need it to offer Reddit to paying users | When launching Reddit as paid feature |
| 6hr auto-sync (Vercel cron) | Needs Supabase + incremental sync active | After Supabase |
| Weekly digest email | Needs Supabase for user data | After Supabase |
| AI semantic search | Needs content stored in DB | After Supabase + content preservation |
| Vercel deployment | No paying users yet | Before first paying user |

---

## Known Issues / Bugs

| Issue | Status | Notes |
|-------|--------|-------|
| Reddit "No communities found" | Fixed — now shows real error + Reconnect link | Was silently returning [] on API errors |
| Reddit setup modal opening on every login | Fixed — only opens after ?reddit=connected | Was triggering whenever Reddit connected but no localStorage prefs |
| Reddit OAuth screen shows "peersupport" | Temporary | Using existing Reddit app for testing. Will switch to X-marks app once Reddit approves. |
| Canvas previously showed 192 bookmarks, now 94 | Parked | `pages:1, apiTotal:94`. Likely X API inconsistency or stale UI count. Not reproduced. |

---

## Research Findings (verified, not assumed)

### Confirmed X bookmark pain points
1. **No data portability** — official archive doesn't include bookmarks, no export
2. **Search is crippled** — keyword only, no Boolean operators
3. **Content loss** — deleted tweet = bookmark gone permanently (confirmed: 192 UI → 94 API)
4. **Organisation paywalled** — folders require X Premium at ~$8/month
5. **Digital hoarding** (medium confidence) — users save compulsively but rarely return

### Competitive landscape
- **Dewey, Circleboom, ContextBolt, Twillot** — X bookmark managers, text list format, no canvas
- **Readwise** ($7.99/month) — highlights from articles/books/tweets. Biggest threat.
- **Raindrop.io** ($3/month) — link saving, no social platform native integration
- **Pocket** — shut down, validated the category
- X-marks differentiator: **visual canvas + cross-platform + content preservation + inline reading**

---

## Retention Strategy

1. **Weekly digest email** (not built) — auto-generated, zero user effort
2. **Daily random resurface** (not built) — one old bookmark surfaced via email
3. **AI weekly insight** (not built) — "You've saved 8 things about pricing — here's what they say"
4. **"To Process" inbox** (not built) — new saves land in inbox
5. **Public canvas sharing** (not built) — social incentive to curate

---

## GitHub
https://github.com/PoonatiGiri/x-marks

## Dev Server
Port 3001 — `npm run dev` (configured in package.json)
Callback URLs registered: `http://localhost:3001/api/auth/callback/twitter`, `http://localhost:3001/api/reddit/callback`
