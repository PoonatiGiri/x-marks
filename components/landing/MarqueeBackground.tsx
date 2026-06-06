// Static animated background for the landing page.
// Pure CSS marquee — no JS, no hydration needed.

type CardItem =
  | { type: "x"; text: string; author: string; handle: string; likes: string; retweets: string }
  | { type: "reddit"; title: string; sub: string; score: string; body?: string }

const CARDS: CardItem[] = [
  { type: "x", author: "Paul Graham", handle: "paulg", text: "The best time to start was yesterday. The second best time is now. Stop waiting for the perfect moment.", likes: "18.4k", retweets: "3.2k" },
  { type: "reddit", sub: "indiehackers", title: "How I got my first 100 paying customers with zero ad spend", score: "2.1k" },
  { type: "x", author: "Naval", handle: "naval", text: "Specific knowledge is knowledge you cannot be trained for. If society can train you, it can train someone else and replace you.", likes: "41k", retweets: "9.8k" },
  { type: "reddit", sub: "startups", title: "Lessons from 3 failed startups before my first win — honest post-mortem", score: "4.7k", body: "I failed 3 times before anything worked. Here's what I wish someone told me..." },
  { type: "x", author: "Pieter Levels", handle: "levelsio", text: "Shipped 5 new features this week. Users are already sending love. Building in public is the best growth hack.", likes: "5.1k", retweets: "612" },
  { type: "reddit", sub: "productivity", title: "The note-taking system I use to retain 90% of everything I read", score: "8.3k" },
  { type: "x", author: "Sahil Lavingia", handle: "shl", text: "The secret to a great product: talk to your users every single week. Not monthly. Every week.", likes: "7.9k", retweets: "1.4k" },
  { type: "reddit", sub: "webdev", title: "Built this side project in a weekend. It's now making $3k MRR", score: "6.2k", body: "Started Friday evening, launched Sunday night. Here's the full story..." },
  { type: "x", author: "Marc Andreessen", handle: "pmarca", text: "Software is eating the world, and AI is eating software. The next decade belongs to builders.", likes: "22k", retweets: "5.6k" },
  { type: "reddit", sub: "entrepreneur", title: "I quit my job 6 months ago to build my own thing. The honest truth.", score: "12k" },
  { type: "x", author: "Patrick McKenzie", handle: "patio11", text: "Charge more. Seriously. Whatever price you're thinking about, double it. Most founders price too low out of fear.", likes: "9.3k", retweets: "2.1k" },
  { type: "reddit", sub: "marketing", title: "Cold email template that got me 73 replies in 2 days (with screenshots)", score: "3.4k" },
  { type: "x", author: "Jason Fried", handle: "jasonfried", text: "Calm is a competitive advantage. So much of the industry runs hot, reactive, chaotic. Cool, collected wins.", likes: "14k", retweets: "2.8k" },
  { type: "reddit", sub: "sideprojects", title: "My open-source project just hit 10k GitHub stars — here's the story", score: "5.1k" },
  { type: "x", author: "Shreyas Doshi", handle: "shreyas", text: "The #1 skill gap in most product managers isn't execution. It's the ability to make hard tradeoffs without flinching.", likes: "6.7k", retweets: "1.1k" },
  { type: "reddit", sub: "MachineLearning", title: "I trained a model on my own reading notes — here's what it surfaced", score: "7.8k", body: "Fed 3 years of Kindle highlights into a small LLM..." },
]

function XCard({ card }: { card: Extract<CardItem, { type: "x" }> }) {
  return (
    <div className="w-[210px] shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
          {card.author[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{card.author}</p>
          <p className="text-[11px] text-gray-400">@{card.handle}</p>
        </div>
        <svg className="w-3 h-3 ml-auto shrink-0 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{card.text}</p>
      <div className="flex gap-3 mt-3 pt-2.5 border-t border-gray-50 text-[11px] text-gray-400">
        <span>{card.likes} likes</span>
        <span>{card.retweets} RTs</span>
      </div>
    </div>
  )
}

function RedditCard({ card }: { card: Extract<CardItem, { type: "reddit" }> }) {
  return (
    <div className="w-[210px] shrink-0 bg-white rounded-2xl border border-orange-200 shadow-sm p-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="w-4 h-4 shrink-0">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="#FF4500"/>
            <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
          </svg>
        </div>
        <span className="text-[11px] font-semibold text-orange-500">r/{card.sub}</span>
      </div>
      <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">{card.title}</p>
      {card.body && <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{card.body}</p>}
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-gray-50 text-[11px] text-gray-400">
        <svg className="w-3 h-3 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
        </svg>
        <span className="text-orange-500 font-medium">{card.score}</span>
        <span>upvotes</span>
      </div>
    </div>
  )
}

function MarqueeRow({ cards, reverse, duration }: { cards: CardItem[]; reverse?: boolean; duration: number }) {
  // Duplicate cards for seamless loop
  const doubled = [...cards, ...cards]
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex gap-4 shrink-0"
        style={{ animation: `${reverse ? "marquee-reverse" : "marquee"} ${duration}s linear infinite` }}
      >
        {doubled.map((card, i) =>
          card.type === "x"
            ? <XCard key={i} card={card} />
            : <RedditCard key={i} card={card} />
        )}
      </div>
    </div>
  )
}

// Distribute cards across rows
function chunk(arr: CardItem[], size: number): CardItem[][] {
  const rows: CardItem[][] = []
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size))
  return rows
}

export function MarqueeBackground() {
  const rows = chunk(CARDS, 4) // 4 cards per row → 4 rows
  const durations = [35, 45, 40, 50] // staggered speeds
  const reverses = [false, true, false, true]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
      {/* Faint tinted backdrop so white cards are visible */}
      <div className="absolute inset-0 bg-slate-50" />

      {/* Rotated card rows */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-5"
        style={{ transform: "rotate(-12deg) scale(1.5)", transformOrigin: "center center" }}
      >
        {rows.map((row, i) => (
          <MarqueeRow key={i} cards={row} reverse={reverses[i]} duration={durations[i]} />
        ))}
      </div>

      {/* White centre keeps CTA fully readable; fades out at edges to reveal cards */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_82%_72%_at_50%_50%,rgba(255,255,255,1)_48%,rgba(255,255,255,0.93)_63%,rgba(255,255,255,0.38)_80%,rgba(255,255,255,0)_96%)]" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </div>
  )
}
