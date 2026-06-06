import { auth, signIn, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BookmarkCanvas } from "@/components/canvas/BookmarkCanvas"

export default async function CanvasPage({
  searchParams,
}: {
  searchParams: Promise<{ reddit?: string; linked?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/")

  const params = await searchParams

  // Display name: prefer username from whichever platform is primary
  const displayName =
    session.user?.name ??
    session.redditUsername ??
    ""

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">X-marks</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connected platform badges */}
          <div className="flex items-center gap-1.5">
            {session.providers.includes("twitter") && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Connected
              </span>
            )}
            {session.providers.includes("reddit") && (
              <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#FF4500"/>
                  <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
                </svg>
                Connected
              </span>
            )}
          </div>

          <span className="text-sm text-gray-500">@{displayName}</span>

          {/* Settings link */}
          <a
            href="/settings"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Settings
          </a>

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
        <BookmarkCanvas
          providers={session.providers}
          xConnected={session.providers.includes("twitter")}
          redditConnected={session.providers.includes("reddit")}
          redditLinkedStatus={params.reddit}
        />
      </main>
    </div>
  )
}
