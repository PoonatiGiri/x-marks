"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { BookmarkNode } from "./BookmarkNode"
import { RedditNode } from "./RedditNode"
import { RedditSetup, loadRedditPrefs, type RedditPreferences } from "./RedditSetup"
import { CommentsPanel } from "./CommentsPanel"
import { ArticlePanel } from "./ArticlePanel"
import type { Bookmark } from "@/lib/twitter"
import type { RedditSave } from "@/lib/reddit"

type SourceFilter = "all" | "twitter" | "reddit"
type PanelState =
  | { type: "comments"; post: RedditSave }
  | { type: "article"; url: string; title: string }
  | null

const nodeTypes = { bookmark: BookmarkNode, reddit: RedditNode }

const CARD_W = 300
const CARD_H = 340
const COL_GAP = 60
const ROW_GAP = 60
const COLS = 8

type AnyItem = Bookmark | RedditSave

function buildNodes(
  items: AnyItem[],
  onClickComments: (post: RedditSave) => void,
  onClickArticle: (url: string, title: string) => void
): Node[] {
  return items.map((item, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const jitterX = (Math.random() - 0.5) * 60
    const jitterY = (Math.random() - 0.5) * 40

    const isReddit = (item as RedditSave).source === "reddit"

    return {
      id: item.id,
      type: isReddit ? "reddit" : "bookmark",
      position: {
        x: col * (CARD_W + COL_GAP) + jitterX,
        y: row * (CARD_H + ROW_GAP) + jitterY,
      },
      data: isReddit
        ? { save: item, onClickComments, onClickArticle }
        : { bookmark: item, onClickArticle },
      draggable: true,
    }
  })
}

function Canvas({
  items, twitterCount, redditCount,
  onSync, syncing, filter, onFilterChange, redditConnected, onManageReddit,
  onClickComments, onClickArticle,
}: {
  items: AnyItem[]
  twitterCount: number
  redditCount: number
  onSync: () => void
  syncing: boolean
  filter: SourceFilter
  onFilterChange: (f: SourceFilter) => void
  redditConnected: boolean
  onManageReddit: () => void
  onClickComments: (post: RedditSave) => void
  onClickArticle: (url: string, title: string) => void
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, , onEdgesChange] = useEdgesState([])

  useEffect(() => {
    setNodes(items.length > 0 ? buildNodes(items, onClickComments, onClickArticle) : [])
  }, [items, setNodes, onClickComments, onClickArticle])

  return (
    <div className="w-full h-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">

        {/* Source filter */}
        <div className="flex items-center bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden text-xs">
          {(["all", "twitter", "reddit"] as SourceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-2 capitalize transition-colors ${
                filter === f ? "bg-black text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {f === "twitter" ? "X" : f === "all" ? `All (${twitterCount + redditCount})` : `Reddit (${redditCount})`}
            </button>
          ))}
        </div>

        {/* Reddit button — connect or manage */}
        {!redditConnected ? (
          <a
            href="/api/reddit/connect"
            className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="white">
              <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.2"/>
              <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
            </svg>
            Connect Reddit
          </a>
        ) : (
          <button
            onClick={onManageReddit}
            className="flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-medium px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="#FF4500">
              <circle cx="10" cy="10" r="10" fill="#FF4500" fillOpacity="0.15"/>
              <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="#FF4500"/>
            </svg>
            Manage Reddit
          </button>
        )}

        <button
          onClick={onSync}
          disabled={syncing}
          className="bg-black text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {syncing ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sync
            </>
          )}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 60, y: 60, zoom: 0.55 }}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
        <Controls className="shadow-sm" />
        <MiniMap
          nodeColor={(n) => n.type === "reddit" ? "#fff7ed" : "#f3f4f6"}
          maskColor="rgba(255,255,255,0.7)"
          className="shadow-sm rounded-xl overflow-hidden"
        />
      </ReactFlow>
    </div>
  )
}

export function BookmarkCanvas() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [redditPosts, setRedditPosts] = useState<RedditSave[]>([])
  const [redditConnected, setRedditConnected] = useState(false)
  const [showRedditSetup, setShowRedditSetup] = useState(false)
  const [showManageReddit, setShowManageReddit] = useState(false)
  const [upvotesPrivate, setUpvotesPrivate] = useState(false)
  const [filter, setFilter] = useState<SourceFilter>("all")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelState>(null)

  const loadRedditFeed = useCallback(async (prefs: RedditPreferences) => {
    if (prefs.subreddits.length === 0 && !prefs.includeUpvoted) return
    try {
      const res = await fetch("/api/reddit/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (res.ok) {
        const data = await res.json()
        setRedditPosts(data.posts ?? [])
        setUpvotesPrivate(data.upvotesPrivate ?? false)
      }
    } catch {}
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setSyncing(true)
      setError(null)

      const xRes = await fetch("/api/bookmarks")
      if (!xRes.ok) {
        const d = await xRes.json()
        throw new Error(d.error ?? "Failed to load bookmarks")
      }
      const xData = await xRes.json()
      setBookmarks(xData.bookmarks)

      const redditRes = await fetch("/api/reddit/saved")
      if (redditRes.status === 401) {
        setRedditConnected(false)
      } else if (redditRes.ok) {
        setRedditConnected(true)
        const prefs = loadRedditPrefs()
        if (prefs) {
          await loadRedditFeed(prefs)
        } else {
          setShowRedditSetup(true)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [loadRedditFeed])

  const handleRedditSetupDone = useCallback(async (prefs: RedditPreferences) => {
    setShowRedditSetup(false)
    await loadRedditFeed(prefs)
  }, [loadRedditFeed])

  const handleClickComments = useCallback((post: RedditSave) => {
    setPanel({ type: "comments", post })
  }, [])

  const handleClickArticle = useCallback((url: string, title: string) => {
    setPanel({ type: "article", url, title })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("reddit") === "connected") {
      window.history.replaceState({}, "", "/canvas")
    }
    loadAll()
  }, [loadAll])

  const filteredItems: AnyItem[] = filter === "all"
    ? [...bookmarks, ...redditPosts]
    : filter === "twitter"
    ? bookmarks
    : redditPosts

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <svg className="w-6 h-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-400">Fetching your saves…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={loadAll} className="text-sm text-gray-600 underline underline-offset-2">
          Try again
        </button>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        <Canvas
          items={filteredItems}
          twitterCount={bookmarks.length}
          redditCount={redditPosts.length}
          onSync={loadAll}
          syncing={syncing}
          filter={filter}
          onFilterChange={setFilter}
          redditConnected={redditConnected}
          onManageReddit={() => setShowManageReddit(true)}
          onClickComments={handleClickComments}
          onClickArticle={handleClickArticle}
        />

        {/* Side panels */}
        {panel?.type === "comments" && (
          <CommentsPanel post={panel.post} onClose={() => setPanel(null)} />
        )}
        {panel?.type === "article" && (
          <ArticlePanel url={panel.url} title={panel.title} onClose={() => setPanel(null)} />
        )}

        {(showRedditSetup || showManageReddit) && redditConnected && (
          <RedditSetup
            onDone={(prefs) => {
              setShowRedditSetup(false)
              setShowManageReddit(false)
              handleRedditSetupDone(prefs)
            }}
            onClose={() => setShowManageReddit(false)}
            isEditing={showManageReddit}
          />
        )}

        {upvotesPrivate && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <span>⚠️ Upvote history is private on Reddit.</span>
            <a href="https://www.reddit.com/settings/privacy" target="_blank" rel="noopener noreferrer" className="underline font-medium">Enable it here →</a>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  )
}
