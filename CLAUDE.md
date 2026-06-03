# X-marks — Project Context for Claude

## What This Product Is

X-marks is a paid SaaS ($9.99/month) that pulls a user's saved content from social platforms and displays it on an **infinite canvas** — so they can actually revisit, rediscover, and use what they've saved instead of letting it rot in a list.

**Core insight:** People save content compulsively (Twitter bookmarks, Reddit saves) but never return to it. The canvas format + AI surfacing (planned) makes rediscovery frictionless.

**Target user:** "Curious professionals" — indie hackers, founders, PMs, designers, knowledge workers. People who already pay for Notion, Readwise, Linear. High intent, low CAC (find tools via Twitter/HN/Product Hunt).

**Positioning:** "Your bookmarks finally work."
vs competitors: X charges $8/month just for folders. X-marks gives canvas + cross-platform + content preservation + search for $9.99.

---

## Current State (what's built and working)

### ✅ Working
- **X OAuth 2.0 login** via NextAuth v5 with auto token refresh
- **X bookmarks fetch** — cursor-paginated, up to 500, with images/media
- **Infinite canvas** using `@xyflow/react` — pan, zoom, drag nodes
- **Reddit OAuth** — secondary account, stored in encrypted HTTP-only cookie (separate from NextAuth session)
- **Reddit subreddit selector** — user picks communities, we pull top posts (week/month)
- **Reddit upvoted posts** — fetched if user has public vote history
- **Reddit content manager** — "Manage Reddit" button in toolbar to update subreddit selections
- **Source filter** — All / X / Reddit tabs in toolbar
- **Sync button** — manual refresh
- **Cards** — X cards (white) and Reddit cards (orange accent) with images, author, metrics

### 🔴 Not Built Yet (critical before paying users)
- **Supabase** — no database yet. Tokens in JWT/cookies, bookmarks re-fetched every page load
- **Incremental sync** — currently re-fetches ALL bookmarks on every sync (expensive: $0.001/bookmark × all bookmarks × syncs/day)
- **Content preservation** — if a tweet is deleted, bookmark is lost. Supabase would store text at first sync
- **Stripe payments** — no payment flow yet
- **Background auto-sync** (6hr) — no cron jobs yet

### 🟡 Planned (Phase 2)
- Weekly digest email (top retention mechanic)
- AI semantic search across bookmarks
- Basic keyword search/filter bar
- Tags and collections
- Public canvas sharing
- Annual plan ($79/year)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Canvas | `@xyflow/react` v12 |
| Auth | NextAuth v5 (beta) — X OAuth 2.0 |
| Reddit auth | Custom OAuth flow, tokens in encrypted cookie |
| Database | **Not added yet** — plan is Supabase |
| Payments | **Not added yet** — plan is Stripe |
| Hosting | **Not deployed yet** — plan is Vercel |
| Styling | Tailwind CSS v4 |

---

## File Structure

```
app/
  api/
    auth/[...nextauth]/   NextAuth handler
    bookmarks/            GET — fetch X bookmarks
    reddit/
      connect/            GET — start Reddit OAuth
      callback/           GET — complete Reddit OAuth, set cookie
      saved/              GET — fetch Reddit saved posts
      subreddits/         GET — fetch subscribed subreddits
      feed/               POST — fetch top posts from selected subreddits + upvotes
  canvas/                 Protected canvas page
  page.tsx                Landing page (login)

components/
  canvas/
    BookmarkCanvas.tsx    Main canvas component — fetches data, manages state
    BookmarkNode.tsx      X bookmark card
    RedditNode.tsx        Reddit post card
    RedditSetup.tsx       Subreddit selector modal (first setup + manage)
  providers.tsx           SessionProvider wrapper

lib/
  auth.ts                 NextAuth config + X token refresh
  twitter.ts              X API — fetchAllBookmarks()
  reddit.ts               Reddit API — fetch saved, subreddits, top posts, upvoted
  reddit-session.ts       Reddit token cookie helpers (encode/decode with NEXTAUTH_SECRET)

types/
  next-auth.d.ts          Session/JWT type augmentation
```

---

## Key Technical Decisions & Gotchas

### X API
- **Cost:** $0.001 per bookmark (owned reads). No free tier — pure pay-per-use credits.
- **Rate limits:** Per user token (180 req/15min). Scales naturally with users.
- **Bookmarks endpoint:** `GET /2/users/{id}/bookmarks` — requires `bookmark.read`, `tweet.read`, `users.read`, `offline.access` scopes
- **Content fragility:** API omits bookmarks from deleted tweets. In one real test, 192 UI bookmarks → 94 API results (~98 deleted). This is why Supabase content preservation matters.
- **Token expiry:** Access tokens last 2 hours. Must include `offline.access` for refresh tokens. Refresh happens in `lib/auth.ts` JWT callback.

### Reddit API
- **Registration required:** Reddit now requires API registration even for free tier. A support request was submitted.
- **Temporary credentials:** Using existing "peersupport" app credentials for testing. Client ID and Secret are in `.env.local`.
- **Free tier is non-commercial only.** For a paid product, Reddit requires a formal commercial contract (~$0.24/1,000 calls). Don't launch Reddit feature to paying users without this.
- **Subreddit top posts are FREE** — public endpoint, no per-request cost regardless of tier.
- **Upvoted posts:** API returns empty if user hasn't made vote history public in Reddit settings.
- **OAuth scope:** `identity history mysubreddits` — needs `mysubreddits` to list subscribed communities.
- **Tokens stored:** In an HTTP-only cookie called `reddit_session`, encrypted with NEXTAUTH_SECRET via `next-auth/jwt` encode/decode.

### Reddit Preferences
- **Stored in:** `localStorage` as `xmarks_reddit_prefs` (JSON). Will move to Supabase.
- **Schema:** `{ subreddits: string[], includeUpvoted: boolean, timeframe: "week" | "month" }`

### Canvas Layout
- **8 columns, 340px row height, 60px gap** — at 191 items = 24 rows, starts at zoom 0.55x
- `defaultViewport={{ x: 60, y: 60, zoom: 0.55 }}` — no fitView (fitView would zoom out to 0.05x and everything looks like a photo collage)
- Nodes are keyed by bookmark/post ID — React Flow deduplicates by ID

### Auth Architecture (current state)

**X (primary identity)**
- Handled by NextAuth v5 with JWT strategy
- `lib/auth.ts` has `DB_AVAILABLE` check — if `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, NextAuth uses Supabase adapter to persist user/account records. Without them, pure JWT (no DB).
- Access token (2hr) + refresh token stored in JWT. Auto-refreshed in `jwt` callback.

**Reddit (secondary account)**
- Custom OAuth flow, independent of NextAuth
- Tokens stored in HTTP-only cookie `reddit_session` encrypted with `NEXTAUTH_SECRET` via `next-auth/jwt` encode/decode
- Reddit can now be connected **before OR after** X sign-in:
  - If X session exists when Reddit callback fires → redirect to `/canvas?reddit=connected`
  - If no X session → redirect to `/?reddit=connected` (landing page, user signs in with X next)
- `app/api/reddit/connect/route.ts` no longer requires an active X session

**Supabase groundwork (partially added)**
- `DB_AVAILABLE = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)` — feature-flagged throughout
- `lib/auth.ts` will use Supabase adapter when DB is available
- `app/api/reddit/feed/route.ts` will persist Reddit saves to DB when available
- `lib/db.ts` expected (not confirmed built) — should expose `getUserIdByTwitterId()`, `upsertRedditSaves()`, `setSyncState()`
- **Supabase env vars not yet set** — currently running in no-DB mode

---

### OAuth Edge Case: Duplicate Accounts

**The problem:** User signs in with X → has account. Later accidentally clicks "Sign in with Reddit" on landing page instead of "Connect Reddit" from canvas → creates a second separate account.

**Three options discussed:**
1. Email-based auto-link — unreliable (Reddit/X often don't expose email)
2. "Is this a new account?" prompt after OAuth — catches most cases
3. "Link accounts" in Settings — self-serve merge for anyone who slips through

**Decision:** Build options 2 + 3 together when Supabase is added. For now:
- Make "Connect Reddit" CTA prominent enough in canvas that users never feel the need to sign out and re-sign-in
- If duplicate account is created: manually merge in Supabase (quick at small scale)
- The landing page shows both "Continue with X" and "Continue with Reddit" — copy should guide returning users to use their original provider

**Status:** Deferred until Supabase. Low risk at current scale.

---

## Product Risks (prioritised)

1. **X kills bookmark API** — existential. Mitigate: Supabase content preservation.
2. **X builds native canvas** — existential. Mitigate: cross-platform + AI is the moat.
3. **High churn from hoarding pattern** — users save, feel good, never return. Mitigate: weekly digest email, proactive AI surfacing.
4. **API cost spiral without incremental sync** — at 200 bookmarks × 4 syncs/day = $24/month/user at $0.001/read. Must build incremental sync before scaling.
5. **Reddit commercial contract** — Reddit requires formal agreement for paid products. Reddit feature can't go to paying users without this.
6. **X ToS gray area** — "service bureau" clause could apply. Low risk at small scale, revisit at ~5k users.

---

## Environment Variables

```
NEXTAUTH_SECRET=          # openssl rand -base64 32
TWITTER_CLIENT_ID=        # developer.x.com
TWITTER_CLIENT_SECRET=    # developer.x.com
REDDIT_CLIENT_ID=         # reddit.com/prefs/apps (currently "peersupport" app for testing)
REDDIT_CLIENT_SECRET=     # reddit.com/prefs/apps
NEXTAUTH_URL=             # http://localhost:3001 (dev) or https://yourdomain.com (prod)
```

---

---

## Build Milestones

### Session 1 — Core MVP
- Scaffolded Next.js 16 project
- X OAuth 2.0 via NextAuth v5 — login, token refresh, session
- X bookmarks API with cursor pagination + media (images/video thumbnails)
- Infinite canvas with `@xyflow/react` — BookmarkNode cards, pan/zoom, minimap
- Manual sync button
- **First working canvas: 93 X bookmarks rendered**
- Created X developer app, resolved port conflict, got OAuth working end-to-end

### Session 2 — Reddit Integration
- Reddit OAuth flow (cookie-based, secondary to X)
- Reddit subreddit selector — fetch subscribed communities, pick what to show
- Reddit top posts feed (`/r/{sub}/top?t=week`) — free, no API cost
- Reddit upvoted posts (with private vote history handling)
- Reddit content manager — "Manage Reddit" button in toolbar, edit mode
- Source filter tabs: All / X / Reddit
- Reddit cards (orange accent) vs X cards (white)
- Fixed canvas zoom (8 cols, `defaultViewport` instead of `fitView`)
- Pushed to GitHub: https://github.com/PoonatiGiri/x-marks
- Submitted Reddit API access request (support ticket)
- CLAUDE.md written

---

## Key Decisions Made (and why)

### Product
| Decision | What was decided | Why |
|----------|-----------------|-----|
| ToS risk | Accept and build (Option A) | Start small, X hasn't targeted bookmark tools |
| Pricing | $9.99/month (up from $4.95) | Target users pay $8-30/month for tools, $4.95 signals side project |
| Free tier | No free tier — 14-day trial instead | API costs stack up even for free users |
| Annual plan | $79/year planned ($6.58/month) | Retention + upfront cash |
| Reddit content | Subreddit top posts, not just saves | Most users have 0 Reddit saves; top posts give value on day 1 |
| Platform scope | X + Reddit only for now | LinkedIn/Instagram APIs locked for personal saved data |
| GitHub Stars | Considered, parked | Too dev-niche, adds to "Indie Hackers only" perception |

### Technical
| Decision | What was decided | Why |
|----------|-----------------|-----|
| Reddit auth | Cookie-based (not NextAuth) | Keeps X as primary identity without Supabase |
| Canvas zoom | `defaultViewport` not `fitView` | fitView at 191 items zooms to 0.05x — unreadable |
| Canvas columns | 8 (not 5) | 5 cols × 191 items = 38 rows = 15,000px tall |
| Reddit prefs storage | localStorage for now | Supabase deferred; preferences survive page reload |
| Reddit feed | Top posts per subreddit | Saves are too sparse; top posts give content even with 0 saves |

---

## Explicitly Deferred (don't re-raise without reason)

| What | Why deferred | When to revisit |
|------|-------------|-----------------|
| Supabase | Need it for persistence, incremental sync, proper auth — but adds complexity | Before first paying user |
| Incremental sync | Requires Supabase | Same — before paying users |
| Stripe payments | No product to charge for yet | After core UX is solid |
| OAuth edge case (duplicate accounts) | Low frequency at early stage, manageable via support | When Supabase is added |
| Reddit commercial contract | Need it to offer Reddit to paying users | When launching Reddit as paid feature |
| 6hr auto-sync (Vercel cron) | Needs Supabase + incremental sync first | After Supabase |
| Weekly digest email | High retention value but needs Supabase for user data | After Supabase |
| AI semantic search | High value differentiator but needs content stored | After Supabase + content preservation |

---

## Research Findings (verified, not assumed)

### Confirmed X bookmark pain points (adversarially verified, 102 agents, 20 sources)
1. **No data portability** — official archive doesn't include bookmarks, no export
2. **Search is crippled** — keyword only, no Boolean operators, indexes tweet text only (not threads or linked articles)
3. **Content loss** — deleted tweet = bookmark gone permanently (confirmed in real test: 192 UI → 94 API results)
4. **Organisation paywalled** — folders require X Premium at ~$8/month
5. **Digital hoarding** (medium confidence) — users save compulsively but rarely return

### Competitive landscape
- **Dewey, Circleboom, ContextBolt, Twillot** — X bookmark managers, text list format, no canvas
- **Readwise** ($7.99/month) — highlights from articles/books/tweets. Has Twitter. Could add canvas. Biggest threat.
- **Raindrop.io** ($3/month) — link saving, no social platform native integration
- **Pocket** — shut down, validated this is a real category
- X-marks differentiator: **visual canvas + cross-platform + content preservation**. None of the above do all three.

---

## Known Issues / Bugs (parked)

| Issue | Status | Notes |
|-------|--------|-------|
| Canvas previously showed 192 bookmarks, now 94 | Parked | Debug showed `pages:1, apiTotal:94`. 192 might have been a state doubling bug or X API inconsistency. Not reproduced. |
| Reddit OAuth screen shows "peersupport" | Temporary | Using existing Reddit app for testing. Will switch to X-marks app once Reddit approves registration. |
| `reddit_session` cookie needs to be cleared + Reddit re-auth when OAuth scope changes | Manual step | If scope is updated (we added `mysubreddits`), user must clear cookie and reconnect Reddit. |

---

## Retention Strategy (designed against hoarding churn)

The #1 risk is users signing up, feeling organised, then never returning. Design decisions to counter this:

1. **Weekly digest email** (not built) — auto-generated, zero user effort, pulls them back
2. **Daily random resurface** (not built) — one old bookmark surfaced via email/notification
3. **AI weekly insight** (not built) — "You've saved 8 things about pricing — here's what they say"
4. **"To Process" inbox** (not built) — new saves land in inbox, user gets completion satisfaction from processing them
5. **Public canvas sharing** (not built) — social incentive to curate

---

## GitHub
https://github.com/PoonatiGiri/x-marks

## Dev Server
Port 3001 — `npm run dev` (configured in package.json)
Callback URLs registered: `http://localhost:3001/api/auth/callback/twitter`, `http://localhost:3001/api/reddit/callback`
