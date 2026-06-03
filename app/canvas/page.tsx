import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import { BookmarkCanvas } from "@/components/canvas/BookmarkCanvas"

export default async function CanvasPage() {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">X-marks</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            @{session.user?.name ?? ""}
          </span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 overflow-hidden">
        <BookmarkCanvas />
      </main>
    </div>
  )
}
