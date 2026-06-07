"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { BackgroundVariant } from "@xyflow/react"

export type CanvasBackground = {
  id: string
  label: string
  group: "Pattern" | "Solid" | "Artistic" | "Abstract" | "Photo"
  surface: string // CSS `background` applied to the canvas pane
  swatch: CSSProperties // preview chip style in the picker
  dark?: boolean // surface is dark — adjust minimap mask
  pattern?: { variant: BackgroundVariant; color: string; gap: number; size: number }
}

function patternSwatch(color: string, kind: "dots" | "grid"): CSSProperties {
  if (kind === "grid") {
    return {
      backgroundColor: "#fff",
      backgroundImage: `linear-gradient(${color} 1px,transparent 1px),linear-gradient(90deg,${color} 1px,transparent 1px)`,
      backgroundSize: "7px 7px",
    }
  }
  return {
    backgroundColor: "#fff",
    backgroundImage: `radial-gradient(${color} 1px,transparent 1px)`,
    backgroundSize: "6px 6px",
  }
}

export const BACKGROUNDS: CanvasBackground[] = [
  // Pattern — white surface with a React Flow overlay. "Dots" preserves the original look.
  { id: "dots", label: "Dots", group: "Pattern", surface: "#ffffff", swatch: patternSwatch("#cbd5e1", "dots"), pattern: { variant: BackgroundVariant.Dots, color: "#e5e7eb", gap: 24, size: 1 } },
  { id: "grid", label: "Grid", group: "Pattern", surface: "#ffffff", swatch: patternSwatch("#dbe0e6", "grid"), pattern: { variant: BackgroundVariant.Lines, color: "#eef0f3", gap: 24, size: 1 } },
  { id: "cross", label: "Cross", group: "Pattern", surface: "#ffffff", swatch: patternSwatch("#cbd5e1", "dots"), pattern: { variant: BackgroundVariant.Cross, color: "#e5e7eb", gap: 24, size: 6 } },

  // Solid — flat colour, no overlay.
  { id: "white", label: "White", group: "Solid", surface: "#ffffff", swatch: { background: "#ffffff", boxShadow: "inset 0 0 0 1px #e5e7eb" } },
  { id: "cream", label: "Cream", group: "Solid", surface: "#faf7f2", swatch: { background: "#faf7f2", boxShadow: "inset 0 0 0 1px #ece6dc" } },
  { id: "sky", label: "Sky", group: "Solid", surface: "#eff6ff", swatch: { background: "#eff6ff", boxShadow: "inset 0 0 0 1px #dbe8fb" } },
  { id: "mint", label: "Mint", group: "Solid", surface: "#f0fdf4", swatch: { background: "#f0fdf4", boxShadow: "inset 0 0 0 1px #d6f0e0" } },
  { id: "slate", label: "Slate", group: "Solid", surface: "#0f172a", dark: true, swatch: { background: "#0f172a" } },
  { id: "ink", label: "Ink", group: "Solid", surface: "#0a0a0a", dark: true, swatch: { background: "#0a0a0a" } },

  // Artistic — gradients / mesh.
  { id: "dawn", label: "Dawn", group: "Artistic", surface: "linear-gradient(135deg,#ffe6c7 0%,#ffc1a6 100%)", swatch: { background: "linear-gradient(135deg,#ffe6c7 0%,#ffc1a6 100%)" } },
  { id: "ocean", label: "Ocean", group: "Artistic", surface: "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)", swatch: { background: "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 100%)" } },
  { id: "lavender", label: "Lavender", group: "Artistic", surface: "linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)", swatch: { background: "linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)" } },
  { id: "aurora", label: "Aurora", group: "Artistic", surface: "radial-gradient(at 18% 22%,#ffd1ff 0px,transparent 45%),radial-gradient(at 82% 8%,#a6c1ee 0px,transparent 45%),radial-gradient(at 12% 82%,#fbc2eb 0px,transparent 45%),#f7f7ff", swatch: { background: "radial-gradient(at 25% 30%,#ffd1ff 0px,transparent 55%),radial-gradient(at 80% 15%,#a6c1ee 0px,transparent 55%),#f7f7ff" } },
  { id: "dusk", label: "Dusk", group: "Artistic", surface: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)", dark: true, swatch: { background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)" } },

  // Abstract — pure-CSS textures and meshes (no network, infinitely scalable).
  { id: "bloom", label: "Bloom", group: "Abstract", surface: "radial-gradient(at 20% 25%,#ffd9ec 0px,transparent 50%),radial-gradient(at 78% 18%,#cfe0ff 0px,transparent 50%),radial-gradient(at 45% 85%,#d9f7e6 0px,transparent 50%),radial-gradient(at 88% 70%,#ffe9c7 0px,transparent 50%),#fbfaff", swatch: { background: "radial-gradient(at 25% 25%,#ffd9ec 0px,transparent 55%),radial-gradient(at 80% 20%,#cfe0ff 0px,transparent 55%),radial-gradient(at 50% 85%,#d9f7e6 0px,transparent 55%),#fbfaff" } },
  { id: "spectrum", label: "Spectrum", group: "Abstract", surface: "conic-gradient(from 180deg at 50% 50%,#fde2e4,#e2ece9,#dfe7fd,#f9e0ff,#fde2e4)", swatch: { background: "conic-gradient(from 180deg at 50% 50%,#fde2e4,#e2ece9,#dfe7fd,#f9e0ff,#fde2e4)" } },
  { id: "peach", label: "Peach", group: "Abstract", surface: "radial-gradient(at 30% 20%,#fde2e4 0,transparent 50%),radial-gradient(at 72% 62%,#fad0c4 0,transparent 50%),linear-gradient(120deg,#fff1eb,#ace0f9)", swatch: { background: "radial-gradient(at 30% 25%,#fde2e4 0,transparent 55%),linear-gradient(120deg,#fff1eb,#ace0f9)" } },
  { id: "stripes", label: "Stripes", group: "Abstract", surface: "repeating-linear-gradient(45deg,#f7f8fa 0px,#f7f8fa 14px,#eef1f5 14px,#eef1f5 28px)", swatch: { background: "repeating-linear-gradient(45deg,#f7f8fa 0px,#f7f8fa 5px,#e6eaf0 5px,#e6eaf0 10px)" } },
  { id: "polka", label: "Polka", group: "Abstract", surface: "radial-gradient(#dfe3ea 2px,transparent 2px) 0 0/22px 22px,#ffffff", swatch: { backgroundColor: "#fff", backgroundImage: "radial-gradient(#cbd2db 1.5px,transparent 1.5px)", backgroundSize: "6px 6px" } },
  { id: "blueprint", label: "Blueprint", group: "Abstract", surface: "linear-gradient(#dbeafe 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,#dbeafe 1px,transparent 1px) 0 0/22px 22px,#eff6ff", swatch: { backgroundColor: "#eff6ff", backgroundImage: "linear-gradient(#bfdbfe 1px,transparent 1px),linear-gradient(90deg,#bfdbfe 1px,transparent 1px)", backgroundSize: "7px 7px" } },

  // Photo — remote placeholder images (Picsum) behind a white scrim for card legibility.
  // NOTE: swap for bundled/licensed assets before production — these hotlink a third party.
  { id: "photo-1018", label: "Mountains", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1018/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1018/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "photo-1015", label: "River", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1015/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1015/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "photo-1019", label: "Valley", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1019/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1019/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "photo-1036", label: "Coast", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1036/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1036/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "photo-1043", label: "Forest", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1043/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1043/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "photo-1062", label: "Shore", group: "Photo", surface: "linear-gradient(rgba(255,255,255,0.55),rgba(255,255,255,0.55)),url(https://picsum.photos/id/1062/1600/900) center/cover no-repeat", swatch: { backgroundImage: "url(https://picsum.photos/id/1062/120/80)", backgroundSize: "cover", backgroundPosition: "center" } },
]

export const DEFAULT_BACKGROUND = BACKGROUNDS[0]

const STORAGE_KEY = "xmarks_canvas_bg"

export function loadBackgroundPref(): CanvasBackground {
  if (typeof window === "undefined") return DEFAULT_BACKGROUND
  try {
    const id = window.localStorage.getItem(STORAGE_KEY)
    return BACKGROUNDS.find((b) => b.id === id) ?? DEFAULT_BACKGROUND
  } catch {
    return DEFAULT_BACKGROUND
  }
}

function saveBackgroundPref(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

const GROUPS: CanvasBackground["group"][] = ["Pattern", "Solid", "Artistic", "Abstract", "Photo"]

export function BackgroundPicker({
  value,
  onChange,
}: {
  value: CanvasBackground
  onChange: (b: CanvasBackground) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function select(b: CanvasBackground) {
    onChange(b)
    saveBackgroundPref(b.id)
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Canvas background"
        aria-label="Canvas background"
        className="flex items-center justify-center w-9 h-9 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path
            d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          style={{ width: 288, maxHeight: "70vh", overflowY: "auto", padding: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.14)" }}
          className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl z-20"
        >
          {GROUPS.map((g) => (
            <div key={g} className="mb-3 last:mb-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5 px-0.5">{g}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "6px" }}>
                {BACKGROUNDS.filter((b) => b.group === g).map((b) => {
                  const selected = b.id === value.id
                  return (
                    <button
                      key={b.id}
                      onClick={() => select(b)}
                      title={b.label}
                      aria-label={b.label}
                      style={{
                        height: 28,
                        width: "100%",
                        borderRadius: 8,
                        outline: selected ? "2px solid #111827" : "1px solid rgba(0,0,0,0.08)",
                        outlineOffset: selected ? 2 : 0,
                        ...b.swatch,
                      }}
                      className="bg-cover transition-transform hover:scale-105"
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
