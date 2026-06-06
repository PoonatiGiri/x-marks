/**
 * Settings page — connected accounts + account merging (Case 9 recovery)
 */

import { auth, signIn, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/")

  const hasX = session.providers.includes("twitter")
  const hasReddit = session.providers.includes("reddit")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/canvas" className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to canvas
          </a>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-semibold text-gray-900">Settings</span>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </form>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* Connected accounts */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Connected accounts</h2>
          <p className="text-xs text-gray-400 mb-5">
            Link both platforms to see X bookmarks and Reddit saves together.
          </p>

          <div className="space-y-3">
            {/* X (Twitter) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">X (Twitter)</p>
                  {hasX && session.twitterId && (
                    <p className="text-xs text-gray-400">ID: {session.twitterId}</p>
                  )}
                </div>
              </div>
              {hasX ? (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Connected
                </span>
              ) : (
                <form
                  action={async () => {
                    "use server"
                    await signIn("twitter", { redirectTo: "/canvas" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Connect →
                  </button>
                </form>
              )}
            </div>

            {/* Reddit */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FF4500" }}>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Reddit</p>
                  {hasReddit && session.redditUsername && (
                    <p className="text-xs text-gray-400">u/{session.redditUsername}</p>
                  )}
                </div>
              </div>
              {hasReddit ? (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Connected
                </span>
              ) : (
                <form
                  action={async () => {
                    "use server"
                    await signIn("reddit", { redirectTo: "/canvas" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Connect →
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Account merge help — shown if only one platform connected */}
        {(!hasX || !hasReddit) && (
          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Think you have two separate accounts?
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              If you previously signed in with {hasX ? "Reddit" : "X"} and created a separate account,
              click Connect above while logged in here — it will link both accounts together automatically.
              If that doesn&apos;t resolve it, email us at{" "}
              <a href="mailto:support@x-marks.app" className="underline font-medium">support@x-marks.app</a>
              {" "}and we&apos;ll merge them manually.
            </p>
          </section>
        )}

        {/* Danger zone */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Account</h2>
          <p className="text-xs text-gray-400 mb-4">Destructive actions — be careful.</p>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
            >
              Sign out of all platforms
            </button>
          </form>
        </section>

      </main>
    </div>
  )
}
