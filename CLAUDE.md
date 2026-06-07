# X-marks — Project Context for Claude

## 🚨 Next Session Priority — Activate Supabase + Full OAuth E2E Testing

**Before building anything else, the next session must:**

1. **Activate Supabase** — add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, run `supabase/migrations/001_initial.sql` in the SQL editor.

2. **Run the full OAuth test suite** (all cases below depend on DB being active):

| Test case | How to test | What to verify |
|-----------|-------------|----------------|
| New user via X | Incognito → "Continue with X" | Canvas loads, X bookmarks visible, "Connect Reddit" in toolbar |
| New user via Reddit | Incognito → "Continue with Reddit" | Canvas loads, Reddit feed visible, "Connect X" in toolbar |
| In-canvas linking (X → +Reddit) | Sign in with X → click "Connect Reddit" in toolbar | Both badges in header, both data sources in canvas |
| In-canvas linking (Reddit → +X) | Sign in with Reddit → click "Connect X" in toolbar | Both badges in header, both data sources in canvas |
| Sign out + sign back in (single platform) | Connect both → sign out → sign in with X only | ⚠️ Need to verify: does Reddit auto-restore from DB? |
| Sign out + sign back in (both) | Connect both → sign out → sign in with X → check if Reddit auto-loads | ⚠️ Core issue — DB lookup in jwt callback should recover Reddit tokens |
| Intent gate fires correctly | Sign in with X → sign out → new incognito → sign in with Reddit | Should see /link page (not go straight to canvas) |
| Intent gate "I'm new" path | On /link → click "Yes, I'm new here" | Goes to canvas, creates separate account |
| Intent gate "link existing" path | On /link → click "Sign in with X to link" | Goes through X OAuth, both platforms connected, one account |
| Settings "Connect →" | Sign in with Reddit only → /settings → click "Connect →" for X | X connects, both platforms shown as connected |
| Duplicate account merge | Manually create two accounts in Supabase → sign in with one | Check settings shows account merge prompt |

3. **Known code issues to revisit during Supabase testing:**
   - The `jwt` callback DB lookup (recovering the second platform's tokens after sign-out) — code is written but **untested with real DB**. This is the most likely thing to need fixing.
   - The intent gate logic (`/link` page) — exact conditions for when it fires need validation with real users in the accounts table.
   - The `signIn` callback's session cookie decode (detecting in-canvas linking) — needs real OAuth flows to validate.

---

## What This Product Is

X-marks is a paid SaaS ($9.99/month) that pulls a user's saved content from social platforms and displays it on an **infinite canvas** — so they can actually revisit, rediscover, and use what they've saved instead of letting it rot in a list.

**Core insight:** People save content compulsively (Twitter bookmarks, Reddit saves) but never return to it. The canvas format + AI surfacing (planned) makes rediscovery frictionless.

**Target user:** "Curious professionals" — indie hackers, founders, PMs, designers, knowledge workers. People who already pay for Notion, Readwise, Linear. High intent, low CAC (find tools via Twitter/HN/Product Hunt).

**Positioning:** "Your saved content, finally useful."
vs competitors: X charges $8/month just for folders. X-marks gives canvas + cross-platform + content preservation + search for $9.99.

---

## Current State (what's built and working)

### ✅ Verified working (confirmed in browser)
- **X OAuth 2.0 sign-in** — login confirmed working
- **X bookmarks fetch** — cursor-paginated, up to 500, with images/media
- **Thread detection** — `is_thread: true` when tweet is self-reply. Purple "Thread" badge on card.
- **Infinite canvas** — `@xyflow/react`, pan/zoom/drag, 8-column deterministic grid.
- **Landing page marquee animation** — cards visibly moving in browser after keyframe fix
- **Landing page** — "Your saved content, finally useful." with animated marquee background. Both "Continue with X" and "Continue with Reddit" as equal sign-in buttons.
- **Marquee animation fix** — `@keyframes` injected via `<style>` tag in the component (Tailwind v4 strips unreferenced keyframes from the CSS bundle).
- **Card sizing** — 210px width confirmed in screenshots
- **Radial gradient** — cards visible around edges, CTA readable, confirmed in screenshots
- **Canvas background picker (Session 6)** — picker UI confirmed in browser by the user (strip-bug and padding fixed after debugging). The picker renders correctly; the actual surface-change on the canvas was verified at build/source level (not personally seen rendered, but the React Flow `style` path is confirmed against library source). Build-clean: `next build` passes with zero lint errors.

### ⚠️ Code complete but NOT yet verified end-to-end
All of the following were built and type-check cleanly, but were never confirmed working in a real browser flow:
- **Reddit OAuth 2.0 sign-in** — last seen still erroring ("Configuration"). Fixes applied (explicit auth URL, Basic Auth token handler, User-Agent userinfo handler, profile mapping) but never confirmed working after final fix
- **Equal-hierarchy auth** — both X and Reddit as first-class providers via NextAuth v5
- **JWT holds both providers** — `xAccessToken`, `xRefreshToken`, `xExpiresAt`, `redditAccessToken`, `redditRefreshToken`, `redditExpiresAt`, `redditUsername`, `providers[]`. Cookie-read on in-session linking, DB accounts table lookup on re-login.
- **In-canvas linking** — "Connect Reddit" while signed in with X (and vice versa)
- **Reddit subreddit selector, feed, comments, upvoted posts** — under new NextAuth session approach (tokens now from session, not cookie)
- **Reddit content manager** — "Manage Reddit" button in toolbar
- **Reddit setup modal** — only auto-opens after `?reddit=connected`
- **Reddit comments panel** and **Article reader panel**
- **Source filter** — All / X / Reddit tabs
- **Keyword search**, **ESC key**, **Sync button**
- **Supabase persistence layer** — code complete, env vars not set. Runs in no-DB mode.
- **Intent Gate** `/link` — shown after OAuth when potential duplicate detected. Never triggered in real flow.
- **Settings page** `/settings` — never opened in browser
- **Canvas toolbar "Connect X/Reddit" buttons** — never clicked in real session
- **Connection status badges** in header
- **Sign-out + re-login with second platform restoring** — DB accounts table lookup written, untested

### 🔴 Not Built Yet (critical before paying users)
- **Supabase env vars** — code is done, but `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` not set in `.env.local`. App runs in no-DB mode.
- **Stripe payments** — no payment flow yet
- **Trial expiry logic** — 14-day trial counter (needs Supabase active)
- **Background auto-sync** (6hr Vercel cron) — no cron jobs yet
- **Vercel deployment** — app not yet live
- **Platform disconnect / unlink** — Settings shows "Connected" but no "Disconnect" button yet

### 🟡 Planned (Phase 2)
- Weekly digest email (top retention mechanic)
- AI semantic search across bookmarks
- Tags and collections
- Public canvas sharing
- Annual plan ($79/year)
- Platform disconnect / unlink in Settings

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Canvas | `@xyflow/react` v12 |
| Auth | NextAuth v5 (beta.31) — X + Reddit OAuth 2.0, equal hierarchy |
| Reddit auth | NextAuth Reddit provider (custom token + userinfo handlers) |
| Database | Supabase — code ready, needs env vars |
| Payments | Not added yet — plan is Stripe |
| Hosting | Not deployed yet — plan is Vercel |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |

---

## File Structure

```
app/
  api/
    auth/[...nextauth]/     NextAuth handler (X + Reddit both go through here)
    bookmarks/              GET — X bookmarks (only if X connected; 401 with xConnected:false if not)
    extract/                POST { url } — article extraction via @extractus/article-extractor
    reddit/
      saved/                GET — Reddit saved posts (uses session.redditAccessToken)
      subreddits/           GET — subscribed subreddits (throws on error, shows real error in UI)
      feed/                 POST — top posts from selected subreddits + upvotes; persists to DB if available
      comments/             POST { permalink } — fetch post comments from Reddit API
  canvas/                   Protected canvas page — passes providers/xConnected/redditConnected to BookmarkCanvas
  link/                     Intent Gate page — shown after OAuth when potential duplicate account detected
  settings/                 Settings page — connected accounts, "Connect →" for missing platform, merge help
  page.tsx                  Landing page — marquee background, X + Reddit equal sign-in buttons

components/
  canvas/
    BookmarkCanvas.tsx      Main canvas — accepts providers/xConnected/redditConnected/redditLinkedStatus props
    BookmarkNode.tsx        X bookmark card (Thread badge, article click handler)
    RedditNode.tsx          Reddit post card (comments/article click handler, external link icon)
    RedditSetup.tsx         Subreddit selector modal (first setup + manage)
    CommentsPanel.tsx       Slide-in panel — Reddit comments with collapsible threads
    ArticlePanel.tsx        Slide-in panel — extracted article content (prose rendering)
    BackgroundPicker.tsx    Canvas background picker — palette button (top-right toolbar) + popover. 26 backgrounds in 5 groups (Pattern/Solid/Artistic/Abstract/Photo). Persists to localStorage. Layout-critical styles are INLINE (see Tailwind v4 gotcha).
  landing/
    MarqueeBackground.tsx   Animated inclined card rows. Injects @keyframes via <style> tag (Tailwind v4 strips unused keyframes).
  providers.tsx             SessionProvider wrapper (wraps entire app — enables client-side signIn())

lib/
  auth.ts                   NextAuth config — X + Reddit providers, JWT callback merges both tokens, signIn callback decision tree, auto-refresh for both providers
  twitter.ts                X API — fetchAllBookmarks() + fetchNewBookmarks() (incremental)
  reddit.ts                 Reddit API — fetch saved, subreddits, top posts, upvoted. No longer handles tokens (those are in session now).
  supabase.ts               Lazy Supabase client singleton (server-side only, service role)
  db.ts                     DB operations — getUserIdByProvider(), getUserIdByTwitterId() (alias), upsertBookmarks, upsertRedditSaves, getSyncState, setSyncState

supabase/
  migrations/
    001_initial.sql         Full schema — NextAuth tables (users, accounts, sessions) + bookmarks + reddit_saves + sync_state + RLS

types/
  next-auth.d.ts            Session/JWT type augmentation — both X and Reddit fields, providers[] array

DELETED:
  app/api/reddit/connect/   Removed — Reddit OAuth now goes through NextAuth
  app/api/reddit/callback/  Removed — NextAuth handles the callback at /api/auth/callback/reddit
  lib/reddit-session.ts     Removed — tokens now live in the JWT, not a cookie
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
- **Email scope NOT added** — X requires special developer portal approval for the `email` scope. Do NOT add it without that approval — it causes X to reject the OAuth request entirely.

### Reddit API
- **Registration required:** Reddit now requires API registration even for free tier. A support request was submitted.
- **Temporary credentials:** Using existing "peersupport" app credentials for testing. Client ID and Secret are in `.env.local`.
- **Free tier is non-commercial only.** For a paid product, Reddit requires a formal commercial contract (~$0.24/1,000 calls). Don't launch Reddit feature to paying users without this.
- **Subreddit top posts are FREE** — public endpoint, no per-request cost regardless of tier.
- **Upvoted posts:** API returns empty if user hasn't made vote history public in Reddit settings.
- **OAuth scope:** `identity history mysubreddits read`
- **Token endpoint requires HTTP Basic Auth** — Reddit's `/api/v1/access_token` requires `Authorization: Basic base64(clientId:clientSecret)`. NextAuth's default sends credentials in the POST body (`client_secret_post`), which Reddit rejects. We override with a custom `token.request` handler.
- **Userinfo endpoint requires User-Agent** — Reddit's `/api/v1/me` returns 403/429 without a User-Agent header. We override with a custom `userinfo.request` handler.
- **Authorization URL must be explicit** — The built-in NextAuth Reddit provider stores its default authorization as a plain string. Providing only `authorization: { params: {...} }` without `url` loses the URL during config merge → Configuration error. Always provide `authorization: { url: "https://www.reddit.com/api/v1/authorize", params: {...} }`.
- **Callback URL (NextAuth):** `http://localhost:3001/api/auth/callback/reddit` — this is what must be registered in reddit.com/prefs/apps. The old `/api/reddit/callback` URL no longer exists.
- **Reddit app must be type "web app"** — not "script" or "installed app". Only "web app" supports the authorization_code grant flow that NextAuth uses. Verify this at reddit.com/prefs/apps.
- **Comments:** `POST /api/reddit/comments` → `GET https://oauth.reddit.com{permalink}.json?limit=50&depth=4&sort=top`

### Reddit Preferences
- **Stored in:** `localStorage` as `xmarks_reddit_prefs` (JSON). Will move to Supabase.
- **Schema:** `{ subreddits: string[], includeUpvoted: boolean, timeframe: "week" | "month" }`

### Canvas Layout
- **8 columns, 300px card width, 60px gaps** — clean grid, no jitter
- `defaultViewport={{ x: 60, y: 60, zoom: 0.55 }}` — no fitView (fitView at 191 items zooms to 0.05x)
- Card positions: deterministic grid, no random offset
- Nodes keyed by bookmark/post ID — React Flow deduplicates

### Canvas Background Picker (Session 6)
- **Component:** `components/canvas/BackgroundPicker.tsx`. Palette button is the rightmost item in the canvas toolbar (top-right corner).
- **State** lives in the inner `Canvas` component: `useState<CanvasBackground>(() => loadBackgroundPref())`. Safe from SSR/hydration mismatch because `Canvas` only renders after the `loading` gate in `BookmarkCanvas` (always true on first client render).
- **26 backgrounds in 5 groups:** Pattern (Dots/Grid/Cross — React Flow `<Background>` overlay), Solid (flat colours incl. 2 dark), Artistic (CSS gradients), Abstract (pure-CSS mesh/conic/stripes/polka/blueprint), Photo (6 remote images).
- **How it's applied:** `<ReactFlow style={{ background: bg.surface }}>`. The `<Background>` pattern overlay renders ONLY for the Pattern group (`bg.pattern` present). MiniMap `maskColor` flips dark when `bg.dark`.
- **Why it renders (verified against @xyflow/react@12.11.0 source):** `.react-flow` stylesheet sets `background-color: var(--xy-background-color, transparent)` — default transparent — so the inline `background` shorthand wins. `.react-flow__background` is also transparent, so the pattern overlays the surface instead of hiding it.
- **Persistence:** `localStorage` key `xmarks_canvas_bg` (stores the background `id`).
- **Photo backgrounds use REMOTE Picsum placeholders** (`https://picsum.photos/id/<id>/...`) behind a 55% white scrim for card legibility. ⚠️ Swap for bundled/licensed assets in `/public` before charging users — hotlinking a third party is fragile and has licensing implications. Abstract/gradient backgrounds have no such concern (pure CSS, no network).
- **All layout-/state-critical styles are INLINE** (grid container, popover width/height/padding, swatch size, selection ring outline) — see Tailwind v4 gotcha below. Only decorative classes (hover zoom, label spacing) remain class-based.

### Search
- Client-side live filter on `filteredItems` (memoized)
- Searches: tweet text, author name, author username; Reddit title, subreddit, author, body
- Cmd+K to focus; ESC to clear; "No results for X" empty state shown in canvas

### Side Panels
- Single `PanelState` in BookmarkCanvas: `{ type: "comments", post } | { type: "article", url, title } | null`
- Reddit text posts → CommentsPanel; Reddit link posts → ArticlePanel; X cards with URL → ArticlePanel
- Panels are `absolute top-0 right-0 h-full w-[380-420px]` positioned over canvas
- ESC closes panel

### Tailwind v4 CSS Gotcha
- `@keyframes` defined in `globals.css` are NOT included in the compiled CSS bundle by Tailwind v4 unless they're referenced by a utility class
- Animations referenced only via inline `style` props are stripped → animation runs (browser sees the name) but nothing moves
- Fix: inject keyframes via a `<style>` JSX element directly in the component that uses them

**Single-use utility classes can also be dropped (Session 6 — confirmed, not just keyframes).** When the background picker first shipped, its swatch grid rendered as a single vertical strip. Root cause: classes used in **only one file** (`grid`, `grid-cols-6`, `w-64`, `shadow-lg`, the `ring-*` selection classes) were not emitted into the served CSS by the running dev server — `display:grid` count was literally 0 in the bundle. Without `display:grid`, `grid-template-columns` did nothing and the `w-full` swatches stacked; without `w-64` the popover collapsed to content width and squeezed the columns.
- **Diagnosis technique:** `grep -rIlF "<class>" app components | grep -v <thisfile>` — if a layout-critical class is used in 0 other files, it's at risk. Then grep the served CSS chunk (`/_next/static/chunks/...css`) for the actual rule.
- **Fix that works every time:** put layout-/state-critical CSS in **inline `style`** objects (immune to Tailwind's content scanning), not utility classes. Reserve utility classes for styles that are either common in the repo or purely decorative (a miss is invisible).
- This is the same failure family as the keyframes issue — Tailwind v4 + Turbopack can omit utilities that aren't seen broadly enough during the running build.

---

## Auth Architecture (Equal-Hierarchy OAuth)

### Design Principle
X and Reddit are **equal-level** sign-in providers. Either can create an account. Once in the canvas, the user can link the other platform. The JWT accumulates tokens from both providers simultaneously using the `...token` spread pattern.

### Session Shape
```ts
session = {
  // X (Twitter)
  xAccessToken?: string        // undefined if not connected
  twitterId?: string           // X provider account ID
  // Reddit
  redditAccessToken?: string   // undefined if not connected
  redditUsername?: string      // Reddit handle
  redditId?: string            // Reddit account ID
  // Which platforms are active in this session
  providers: ("twitter" | "reddit")[]
  error?: "RefreshAccessTokenError"
}
```

### JWT Multi-Provider Token Accumulation
When a second provider is connected (canvas toolbar or settings), the `jwt` callback fires with `account` (new provider). **The `token` parameter here is a FRESH empty token for the new OAuth flow — it does NOT contain the existing session's tokens.** NextAuth creates a brand new JWT for each OAuth sign-in; it does not automatically merge sessions.

To preserve both providers' tokens, the `jwt` callback explicitly reads the existing session cookie (`authjs.session-token`) using `decode()` from `next-auth/jwt`, extracts the OTHER provider's fields, and injects them into the new JWT:

```ts
// Inside jwt callback, when account is present:
let existing: Partial<JWT> = {}
// decode the current session cookie to get the other provider's tokens
const decoded = await decode({ token: raw, secret, salt: "authjs.session-token" })
if (decoded) existing = decoded as Partial<JWT>

// User was signed in with X. Now linking Reddit:
if (account.provider === "reddit") {
  return {
    ...token,                          // base fields (sub, iat, etc.) for new session
    xAccessToken: existing.xAccessToken,  // ← pulled from current X session cookie
    xRefreshToken: existing.xRefreshToken,
    xExpiresAt: existing.xExpiresAt,
    twitterId: existing.twitterId,
    redditAccessToken: account.access_token,  // new Reddit tokens
    redditRefreshToken: account.refresh_token,
    ...
    providers: [...(existing.providers ?? []), "reddit"],
  }
}
```

**Without this cookie-read, the `...token` spread only spreads the empty new-session token — connecting Reddit would silently drop the X session (and vice versa).** The same pattern applies in reverse when X is linked to a Reddit-primary session.

### Auto Token Refresh
Both providers' tokens are refreshed in the `jwt` callback on every request:
- **X:** tokens expire in 2 hours. Refresh endpoint: `POST https://api.x.com/2/oauth2/token` with Basic Auth.
- **Reddit:** tokens expire in 1 hour. Refresh endpoint: `POST https://www.reddit.com/api/v1/access_token` with Basic Auth.

If refresh fails, `error: "RefreshAccessTokenError"` is set in the token. The bookmarks route checks for this and returns 401.

### signIn Callback — Identity Fragmentation Decision Tree

Called on every OAuth sign-in. Runs BEFORE the session is created.

```
1. No DB available?
   → return true (no fragmentation detection possible)

2. Existing active session detected (user is already logged in)?
   (detected by decoding the authjs.session-token cookie)
   → set user.id = existing session's sub
   → return true (this is a LINK operation, not a new account)

3. Email match found in users table?
   (Reddit sometimes returns email; X email scope not approved)
   → set user.id = existing user's id
   → return true (auto-link silently)

4. New account, no email match — is there a user with the OTHER platform who hasn't linked THIS platform yet?
   (Query: accounts with provider=other → filter out those who also have provider=current → any remaining?)
   → If yes: return "/link?provider=<provider>&newUser=true" (intent gate)
   → Account IS created, user is redirected before seeing canvas
   → Intent gate: "I'm new" → canvas | "I have an account" → signIn with other platform → jwt merges tokens
   → If no (empty DB, or all users already have both platforms): return true, proceed normally

5. Otherwise (first user ever, or no DB):
   → return true (new account, proceed normally)
```

### In-Canvas Platform Linking (Cases 7 & 8)
- User is signed in (e.g., with X) → clicks "Connect Reddit" in toolbar
- Client-side: `signIn("reddit", { callbackUrl: "/canvas" })` from `next-auth/react`
- Reddit OAuth completes → `jwt` callback fires with a **fresh empty token** + Reddit account
- `jwt` callback reads the existing `authjs.session-token` cookie via `decode()`, extracts X fields, injects them alongside the new Reddit tokens → new JWT has both
- `signIn` callback also detects the existing session cookie → sets `user.id` to existing user → adapter links (not creates) the Reddit account

### Settings Page — Recovery for Accidental Duplicates (Case 9)
- `/settings` shows both platforms with "Connected ✓" or "Connect →"
- Clicking "Connect →" while logged in as User A triggers the in-canvas linking flow above
- Automatically merges the accounts via `user.id` override in signIn callback

### Known Limitations
| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| JWT cleared on sign-out (no DB) | Without Supabase, tokens only live in the JWT cookie. Sign-out clears it. Second platform must be reconnected. | Unavoidable without DB — activating Supabase fixes this permanently. |
| JWT cleared on sign-out (with DB) | DB has both platforms linked but the fresh JWT on re-login doesn't automatically load them. | Code written: `jwt` callback reads the other provider's tokens from the `accounts` table on sign-in. Reddit username recovered from `providerAccountId`. If `expires_at` is null, forced to past to trigger refresh. **Untested with real DB — must verify in E2E testing when Supabase is activated.** |
| Email auto-link is silent | Two different people with the same email across platforms get merged | Rare in practice; email not collected from X (no email scope) |
| No "disconnect" flow | Can't unlink a platform without signing out | Deferred — low priority at current scale |
| DB off + only 1 provider in session | X bookmarks not shown if signed in via Reddit only | Canvas skips X fetch when `xConnected=false`; shows "Connect X" button |
| Intent gate can still false-positive on genuinely new users | If User 1 has X only and User 2 (a genuinely new person) signs up with Reddit, User 2 sees the gate. They click "Yes, I'm new" and proceed — one extra click. | Gate only fires when there's at least one user with the OTHER platform who hasn't linked THIS platform — much tighter than "any users exist". Cannot be fully eliminated without true cross-platform identity matching. |

### ⚠️ Intent Gate Logic — Needs Review
The signIn callback in `lib/auth.ts` (around line 239) implements the fragmentation detection. The current logic queries the accounts table to check if any user has the OTHER platform but not THIS one, and redirects to `/link` if so. This was tightened from a broad "any users exist" check to this more targeted version — but the exact conditions and UX flow need a careful review pass before launch. Hold off on building more on top of this until it's validated end-to-end with real sign-in flows.

### Dead Code in `lib/reddit.ts`
`exchangeCodeForTokens()` and `refreshRedditTokens()` are still exported but no longer called anywhere — the custom OAuth flow they supported (`/api/reddit/connect` and `/api/reddit/callback`) was deleted. These functions are dead code and can be removed in a cleanup pass. The rest of `reddit.ts` (fetchRedditSaved, fetchSubscribedSubreddits, fetchSubredditTopPosts, fetchUpvotedPosts) is still actively used — those functions take `accessToken` as a parameter, which comes from the session now instead of the cookie.

### `DB_AVAILABLE` Inconsistency
`lib/auth.ts` exports `DB_AVAILABLE` as a module-level constant. However, `app/api/bookmarks/route.ts` and `app/api/reddit/feed/route.ts` each redeclare it locally rather than importing it from auth.ts. This is harmless (same env var check) but inconsistent. Future routes should import from auth.ts: `import { DB_AVAILABLE } from "@/lib/auth"`.

### Registered OAuth Callback URLs
```
X (Twitter):  http://localhost:3001/api/auth/callback/twitter
Reddit:       http://localhost:3001/api/auth/callback/reddit
```
Both must be registered in the respective developer consoles.

---

## Supabase Persistence Layer
- **Schema:** `supabase/migrations/001_initial.sql` — run once in Supabase SQL editor
- **Activation:** add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. App detects and switches modes.
- **Graceful degradation:** all DB code is behind `DB_AVAILABLE` check. Without env vars, full fetch every load (original behaviour). No fragmentation detection (intent gate never fires).
- **Incremental sync:** `fetchNewBookmarks()` stops fetching X API pages once it hits a tweet ID already in DB.
- **Content preservation:** deleted tweets remain in DB with their text. Canvas serves from DB, not live API.
- **Reddit saves:** persisted after each feed fetch (non-fatal if it fails).
- **User lookup:** `getUserIdByProvider(provider, providerAccountId)` maps any provider ID → Supabase UUID. `getUserIdByTwitterId()` is an alias for backwards compatibility.

---

## Landing Page Background
- 4 rows of fake-but-realistic X tweet and Reddit post cards
- Rows move horizontally at -12° inclination, alternating directions, staggered speeds (35–50s)
- **`@keyframes` injected via `<style>` tag inside `MarqueeBackground.tsx`** — Tailwind v4 strips `@keyframes` from `globals.css` if not referenced by a utility class. Browser recognises the animation name but nothing moves. Fix: inject inline.
- Cards duplicated in DOM for seamless infinite loop
- White radial gradient vignette keeps CTA readable while showing cards around the edges
- Card width: 210px (reduced from 260px for better visual density)

---

## Environment Variables

```
NEXTAUTH_SECRET=          # openssl rand -base64 32
TWITTER_CLIENT_ID=        # developer.x.com
TWITTER_CLIENT_SECRET=    # developer.x.com
REDDIT_CLIENT_ID=         # reddit.com/prefs/apps (currently "peersupport" app for testing)
REDDIT_CLIENT_SECRET=     # reddit.com/prefs/apps
NEXTAUTH_URL=             # http://localhost:3001 (dev) or https://yourdomain.com (prod)

# Supabase — add these to activate persistence + incremental sync + fragmentation detection
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
- Reddit OAuth flow (cookie-based, secondary to X — later replaced)
- Reddit subreddit selector, top posts feed, upvoted posts
- Reddit content manager ("Manage Reddit" in toolbar)
- Source filter tabs: All / X / Reddit
- Fixed canvas zoom (8 cols, `defaultViewport`)
- Pushed to GitHub

### Session 3 — Interactivity
- Reddit comments panel, article extraction panel, thread detection
- Search bar (Cmd+K, live filter, ESC)
- Stable card grid (removed jitter)
- Landing page refresh — new headline, feature pills
- `@tailwindcss/typography` for article prose rendering

### Session 4 — Persistence + Auth (initial)
- Supabase persistence layer — schema, incremental sync, content preservation
- Reddit setup modal fix, Reddit errors surfaced, Reddit on landing page
- Landing page marquee background

### Session 5 — Landing Page Polish + Equal-Hierarchy OAuth
- **Marquee animation fix** — keyframes injected inline (Tailwind v4 bundle stripping)
- **Card sizing** — reduced from 260px to 210px
- **Radial gradient tuning** — cards visible around edges, center stays readable
- **Equal-hierarchy OAuth** — X and Reddit both first-class providers via NextAuth
  - Reddit moved from cookie sidecar → full NextAuth provider
  - Custom token handler (Basic Auth) — Reddit rejects NextAuth's default `client_secret_post`
  - Custom userinfo handler (User-Agent) — Reddit rejects requests without it
  - Custom profile() mapping — Reddit uses username as `id`, not a numeric sub
  - Explicit authorization URL required — NextAuth merge strips URL when only `params` provided
  - X `email` scope NOT added (requires developer portal approval; causes hard X rejection)
- **JWT multi-provider token accumulation** — two-source recovery:
  - Source 1: reads existing `authjs.session-token` cookie to recover other provider's tokens during in-session linking (e.g., user clicks "Connect Reddit" while signed in with X)
  - Source 2: reads `accounts` table in Supabase to recover linked provider's tokens on re-login after sign-out (**code written, untested with real DB**)
- **Intent Gate** `/link` — shown after OAuth when potential duplicate detected. Logic: fires only when there's a user with the OTHER platform who hasn't linked THIS one yet (not just "any users exist")
- **Settings page** `/settings` — connected accounts, "Connect →" for missing platform
- **Canvas toolbar** — "Connect X" + "Connect Reddit" via client-side `signIn()`
- **Connection status badges** in header
- **Deleted:** `/api/reddit/connect`, `/api/reddit/callback`, `lib/reddit-session.ts`
- **Added:** `getUserIdByProvider()` in `db.ts` (provider-agnostic user lookup)

### Session 6 — Commit/Push + Canvas Background Picker
- **Committed & pushed all of Session 5's previously-uncommitted work** (equal-hierarchy OAuth, `/link`, `/settings`, deleted Reddit cookie routes). Commit `4627167`.
- **Canvas Background Picker** (commit `7e469f1`) — new `BackgroundPicker.tsx` + wiring in `BookmarkCanvas.tsx`. 26 backgrounds, 5 groups, top-right palette button, localStorage persistence. See "Canvas Background Picker" under Key Technical Decisions for details.
  - Debugged a "vertical strip" rendering bug → root cause was Tailwind v4 dropping single-use utility classes (`grid`, `grid-cols-6`, `w-64`, etc.). Fix: inlined all layout-critical styles. This reinforced and extended the Tailwind v4 gotcha (now documented for classes, not just keyframes).
  - Verified: `tsc --noEmit` exit 0, `next build` clean (zero lint errors), React Flow `style` path confirmed against `@xyflow/react@12.11.0` source.
- **Deployment groundwork (explored, not executed):**
  - Vercel CLI v52 installed and logged in as `poonatigiri28-3341`. Project **NOT linked** yet (`vercel link` + `vercel --prod` would deploy).
  - Git push from this environment works (HTTPS remote authenticated).
  - **Blocker for a *working* deploy:** OAuth is host-locked to `localhost:3001` via `NEXTAUTH_URL` + the registered callback URLs. Any non-localhost host (vercel.app, LAN IP, tunnel) breaks sign-in until (a) `NEXTAUTH_URL` is set to the new host AND (b) the new `…/api/auth/callback/{twitter,reddit}` URLs are registered at developer.x.com and reddit.com/prefs/apps. Those two console edits cannot be done from the CLI.
  - **Mobile access:** landing/UI viewable on mobile via LAN IP (`192.168.0.4:3001`, same Wi-Fi) or a `cloudflared` tunnel (installed via brew; quick tunnels are temporary + random URL and die on Mac sleep). OAuth login does NOT work over either — same host-lock reason. Stable mobile login = Vercel deploy.

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
| Auth hierarchy | **Equal — X and Reddit both first-class** | Users should be able to create account with either platform. Previous X-primary approach created confusion and required workarounds. |

### Technical
| Decision | What was decided | Why |
|----------|-----------------|-----|
| Reddit auth | **NextAuth provider (not cookie)** | Equal hierarchy requires proper provider, not sidecar. Cookie approach can't accumulate tokens in JWT. |
| JWT multi-provider | `...token` spread in jwt callback | Preserves existing provider tokens when second provider is linked. JWT is the source of truth for both sets of tokens. |
| X email scope | **NOT added** | X requires explicit developer portal approval. Without it, X rejects the entire OAuth request. |
| Reddit token endpoint | Custom `request` handler | Reddit requires `client_secret_basic` (Basic Auth header). NextAuth default is `client_secret_post` (body params) which Reddit rejects. |
| Reddit userinfo | Custom `request` handler | Reddit requires `User-Agent` header on all API calls. NextAuth doesn't send one. |
| Reddit authorization URL | Explicit `url` + `params` object | NextAuth merges provider config with user config. If only `params` provided (no `url`), the URL is lost during merge → Configuration error. |
| Canvas zoom | `defaultViewport` not `fitView` | fitView at 191 items zooms to 0.05x — unreadable |
| Canvas jitter | Removed entirely | Clean grid reads better |
| JWT strategy | Always JWT (even with adapter) | Database sessions would lose access tokens from session |
| DB activation | Feature-flagged via env var check | App works identically without Supabase keys |
| Incremental sync | Stop at first known ID | X API returns newest first; no need to scan full history every time |
| Marquee keyframes | Inline `<style>` tag in component | Tailwind v4 strips `@keyframes` from globals.css if not referenced by utility class |

---

## Explicitly Deferred (don't re-raise without reason)

| What | Why deferred | When to revisit |
|------|-------------|-----------------|
| **Activate Supabase + full OAuth E2E testing** | Needs project setup + env vars. All multi-provider JWT recovery, intent gate, and account linking logic is written but untested with real DB. | **Do this next — highest priority.** See "Next Session Priority" section at top. |
| Incremental sync (live) | Supabase code built, not activated | After Supabase env vars added |
| Stripe payments | No product to charge for yet | After Supabase active |
| Trial expiry logic | Needs user records in Supabase | After Supabase active |
| Platform disconnect / unlink | Low priority | After core features stable |
| Reddit commercial contract | Need it to offer Reddit to paying users | When launching Reddit as paid feature |
| 6hr auto-sync (Vercel cron) | Needs Supabase + incremental sync active | After Supabase |
| Weekly digest email | Needs Supabase for user data | After Supabase |
| AI semantic search | Needs content stored in DB | After Supabase + content preservation |
| Vercel deployment | No paying users yet | Before first paying user. Note: Vercel CLI already installed + logged in; needs `vercel link`, env vars, and OAuth callback URL updates (see Session 6 milestone). |
| Account merge UI (complex duplicate case) | DB needed; at small scale, manual merge in Supabase | After Supabase active |
| Swap photo backgrounds → bundled/licensed assets | Photo backgrounds currently hotlink remote Picsum placeholders | Before charging users (licensing + reliability) |

---

## Known Issues / Bugs

| Issue | Status | Notes |
|-------|--------|-------|
| Reddit OAuth "Configuration" error | Fixed — explicit authorization URL, custom token handler (Basic Auth), custom userinfo handler (User-Agent) | Root causes: missing explicit `url` in authorization config, wrong token auth method, missing User-Agent on userinfo call |
| X OAuth "Something went wrong" | Fixed — removed `email` scope | X requires developer portal approval for email scope; adding it causes X to reject the OAuth request |
| Reddit app callback URL | Updated to `http://localhost:3001/api/auth/callback/reddit` | Old URL (`/api/reddit/callback`) no longer exists — must be updated in reddit.com/prefs/apps |
| Reddit "No communities found" | Fixed | Was silently returning [] on API errors |
| Reddit setup modal opening on every login | Fixed | Only opens after ?reddit=connected |
| Reddit OAuth screen shows "peersupport" | Temporary | Using existing Reddit app for testing. Will switch to X-marks app once Reddit approves. |
| Marquee background not animating | Fixed — keyframes injected inline | Tailwind v4 was stripping @keyframes from the CSS bundle |
| Second platform drops after sign-out + sign back in | Code written (DB accounts table lookup in jwt callback) — **not yet verified with real Supabase DB** | Will be confirmed/fixed during Supabase E2E testing. In no-DB mode this is unfixable — user must reconnect. |
| Canvas previously showed 192 bookmarks, now 94 | Parked | Likely X API inconsistency. Not reproduced. |

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

## OAuth Callback URLs (must match developer console registrations)
```
X (Twitter):  http://localhost:3001/api/auth/callback/twitter
Reddit:       http://localhost:3001/api/auth/callback/reddit
```
