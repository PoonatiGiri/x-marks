"use client"

import { useEffect, useState } from "react"

interface ArticleData {
  title?: string
  content?: string
  description?: string
  author?: string
  published?: string
  source?: string
  url?: string
}

export function ArticlePanel({
  url,
  title,
  onClose,
}: {
  url: string
  title: string
  onClose: () => void
}) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setArticle(null)
    setLoading(true)
    setError(null)

    fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setArticle(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [url])

  return (
    <div className="absolute top-0 right-0 h-full w-[420px] bg-white border-l border-gray-100 shadow-xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate mb-0.5">{new URL(url).hostname}</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>
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

      {/* Open original link */}
      <div className="px-4 py-2 border-b border-gray-50 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          Open original article
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex items-center justify-center h-24 gap-2">
            <svg className="w-4 h-4 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-gray-400">Extracting article…</span>
          </div>
        )}

        {error && (
          <div className="py-4 text-center">
            <p className="text-xs text-red-400 mb-2">{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 underline"
            >
              Open original instead →
            </a>
          </div>
        )}

        {!loading && !error && article && (
          <>
            {(article.author || article.published) && (
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
                {article.author && <span>{article.author}</span>}
                {article.published && (
                  <span>{new Date(article.published).toLocaleDateString()}</span>
                )}
              </div>
            )}

            {article.content ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_p]:text-xs [&_p]:leading-relaxed [&_a]:text-blue-500 [&_img]:rounded-lg [&_img]:max-w-full [&_ul]:text-xs [&_ol]:text-xs [&_li]:leading-relaxed [&_blockquote]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : article.description ? (
              <p className="text-xs text-gray-600 leading-relaxed">{article.description}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
