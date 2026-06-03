"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { Bookmark } from "@/lib/twitter"

type BookmarkNodeData = { bookmark: Bookmark; onClickArticle?: (url: string, title: string) => void }

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function BookmarkNode({ data }: NodeProps) {
  const { bookmark, onClickArticle } = data as BookmarkNodeData
  const tweetUrl = `https://x.com/${bookmark.author_username}/status/${bookmark.id}`
  const image = bookmark.media?.[0]
  const imageUrl = image?.url ?? image?.preview_image_url
  const cleanText = bookmark.text.replace(/https:\/\/t\.co\/\S+/g, "").trim()
  const hasArticle = !!bookmark.expanded_url

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className="relative w-[300px] bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all group"
        onClick={(e) => {
          e.stopPropagation()
          if (hasArticle && onClickArticle) {
            onClickArticle(bookmark.expanded_url!, cleanText || bookmark.text)
          }
        }}
      >
        {/* Image */}
        {imageUrl && (
          <div className="w-full h-36 overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-4">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-3">
            {bookmark.author_profile_image ? (
              <img
                src={bookmark.author_profile_image.replace("_normal", "_bigger")}
                alt={bookmark.author_name}
                className="w-8 h-8 rounded-full shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {bookmark.author_name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
                {bookmark.author_name}
              </p>
              <p className="text-xs text-gray-400 truncate">@{bookmark.author_username}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {bookmark.is_thread && (
                <span className="text-[10px] font-medium text-purple-500 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full leading-none">
                  Thread
                </span>
              )}
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-300 hover:text-black transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Text */}
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-4">
            {cleanText || bookmark.text}
          </p>

          {/* Article hint */}
          {hasArticle && (
            <p className="text-[11px] text-blue-400 truncate mt-2">
              {new URL(bookmark.expanded_url!).hostname}
            </p>
          )}

          {/* Metrics */}
          {bookmark.public_metrics && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
              <span>{formatCount(bookmark.public_metrics.like_count)} likes</span>
              <span>{formatCount(bookmark.public_metrics.retweet_count)} RTs</span>
              {bookmark.public_metrics.reply_count > 0 && (
                <span>{formatCount(bookmark.public_metrics.reply_count)} replies</span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
}
