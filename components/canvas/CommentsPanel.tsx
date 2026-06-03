"use client"

import { useEffect, useState } from "react"
import type { RedditSave } from "@/lib/reddit"
import type { RedditComment } from "@/app/api/reddit/comments/route"

function timeAgo(utc: number): string {
  const diff = Math.floor(Date.now() / 1000) - utc
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Comment({ comment, maxDepth = 4 }: { comment: RedditComment; maxDepth?: number }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`${comment.depth > 0 ? "pl-3 border-l border-gray-100" : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-700">u/{comment.author}</span>
          <span className="text-xs text-orange-500 font-medium">{comment.score > 0 ? `+${comment.score}` : comment.score}</span>
          <span className="text-xs text-gray-300">{timeAgo(comment.created_utc)}</span>
          {comment.replies.length > 0 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              {collapsed ? `[+${comment.replies.length}]` : "[-]"}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
          {comment.body}
        </p>
      </div>

      {!collapsed && comment.depth < maxDepth && comment.replies.map((r) => (
        <Comment key={r.id} comment={r} maxDepth={maxDepth} />
      ))}
    </div>
  )
}

export function CommentsPanel({
  post,
  onClose,
}: {
  post: RedditSave
  onClose: () => void
}) {
  const [comments, setComments] = useState<RedditComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setComments([])
    setLoading(true)
    setError(null)

    fetch("/api/reddit/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permalink: post.permalink }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setComments(data.comments)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [post.id])

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] bg-white border-l border-gray-100 shadow-xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-orange-500">r/{post.subreddit}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Open on Reddit link */}
      <div className="px-4 py-2 border-b border-gray-50 shrink-0">
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          Open on Reddit
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading && (
          <div className="flex items-center justify-center h-24 gap-2">
            <svg className="w-4 h-4 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-gray-400">Loading comments…</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 py-4 text-center">{error}</p>
        )}

        {!loading && !error && comments.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">No comments yet.</p>
        )}

        {comments.map((c) => (
          <Comment key={c.id} comment={c} />
        ))}
      </div>
    </div>
  )
}
