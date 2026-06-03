"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { RedditSave } from "@/lib/reddit"

type RedditNodeData = { save: RedditSave }

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function RedditNode({ data }: NodeProps) {
  const { save } = data as RedditNodeData

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <a
        href={save.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-[300px] bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden cursor-pointer hover:shadow-xl hover:border-orange-200 transition-all group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview image */}
        {save.previewImage && (
          <div className="w-full h-36 overflow-hidden bg-gray-100">
            <img
              src={save.previewImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-4">
          {/* Subreddit + Reddit icon */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 shrink-0">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#FF4500"/>
                <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-orange-500">r/{save.subreddit}</span>
            <span className="text-xs text-gray-300 ml-auto">u/{save.author}</span>
          </div>

          {/* Title */}
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3 mb-2">
            {save.title}
          </p>

          {/* Body preview for text posts */}
          {save.is_self && save.body && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {save.body}
            </p>
          )}

          {/* Link URL for link posts */}
          {!save.is_self && save.url && (
            <p className="text-xs text-blue-400 truncate">
              {new URL(save.url).hostname}
            </p>
          )}

          {/* Score */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <svg className="w-3 h-3 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
            <span className="text-orange-500 font-medium">{formatScore(save.score)}</span>
            <span className="ml-1">upvotes</span>
          </div>
        </div>
      </a>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
}
