"use client"

import { useEffect, useState } from "react"
import type { SubredditInfo } from "@/lib/reddit"

export interface RedditPreferences {
  subreddits: string[]
  includeUpvoted: boolean
  timeframe: "week" | "month"
}

const STORAGE_KEY = "xmarks_reddit_prefs"

export function loadRedditPrefs(): RedditPreferences | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveRedditPrefs(prefs: RedditPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function RedditSetup({ onDone, onClose, isEditing = false }: {
  onDone: (prefs: RedditPreferences) => void
  onClose?: () => void
  isEditing?: boolean
}) {
  const existing = loadRedditPrefs()
  const [subreddits, setSubreddits] = useState<SubredditInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(existing?.subreddits ?? []))
  const [includeUpvoted, setIncludeUpvoted] = useState(existing?.includeUpvoted ?? false)
  const [timeframe, setTimeframe] = useState<"week" | "month">(existing?.timeframe ?? "week")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/reddit/subreddits")
      .then((r) => r.json())
      .then((d) => {
        setSubreddits(d.subreddits ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const filtered = subreddits.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = () => {
    const prefs: RedditPreferences = {
      subreddits: [...selected],
      includeUpvoted,
      timeframe,
    }
    saveRedditPrefs(prefs)
    onDone(prefs)
  }

  return (
    <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#FF4500"/>
                <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
              </svg>
              <h2 className="text-base font-semibold text-gray-900">
                {isEditing ? "Manage Reddit" : "Set up Reddit"}
              </h2>
            </div>
            {isEditing && onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isEditing
              ? "Update your communities and settings. Canvas will refresh with your new selection."
              : "Pick communities to bring into your canvas. We'll pull the top posts so there's always something worth revisiting."}
          </p>
        </div>

        {/* Upvotes toggle */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Include upvoted posts</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Requires vote history to be public in Reddit settings.{" "}
                <a href="https://www.reddit.com/settings/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Enable here →</a>
              </p>
            </div>
            <button
              onClick={() => setIncludeUpvoted((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${includeUpvoted ? "bg-orange-500" : "bg-gray-200"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${includeUpvoted ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Timeframe */}
        <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Show top posts from</span>
          {(["week", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${timeframe === t ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Past {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50">
          <input
            type="text"
            placeholder="Search communities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-300"
          />
        </div>

        {/* Subreddit list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="w-5 h-5 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No communities found</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.name}
                onClick={() => toggle(s.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors text-left ${
                  selected.has(s.name) ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                {s.icon ? (
                  <img src={s.icon} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
                    r/
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">r/{s.name}</p>
                  <p className="text-xs text-gray-400">{(s.subscribers / 1000).toFixed(0)}k members</p>
                </div>
                {selected.has(s.name) && (
                  <svg className="w-4 h-4 text-orange-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {selected.size} {selected.size === 1 ? "community" : "communities"} selected
          </span>
          <button
            onClick={handleSave}
            disabled={selected.size === 0 && !includeUpvoted}
            className="bg-orange-500 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEditing ? "Update canvas →" : "Bring to canvas →"}
          </button>
        </div>
      </div>
    </div>
  )
}
