/**
 * Intent Gate — shown after OAuth when we can't auto-determine if this is a
 * new user or a returning user who signed in with the wrong platform.
 *
 * Cases handled:
 *  - New user  → go straight to canvas
 *  - Returning user with existing account on the other platform → sign in with
 *    the other platform so the JWT accumulates both providers' tokens, then
 *    go to canvas
 */

import { auth, signIn, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LinkPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; newUser?: string }>
}) {
  const session = await auth()

  // If not signed in at all, send to landing
  if (!session) redirect("/")

  const params = await searchParams
  const arrivedVia = params.provider ?? "unknown" // "twitter" | "reddit"
  const otherProvider = arrivedVia === "twitter" ? "reddit" : "twitter"
  const otherProviderLabel = otherProvider === "twitter" ? "X" : "Reddit"
  const arrivedViaLabel = arrivedVia === "twitter" ? "X" : "Reddit"

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl font-bold tracking-tight text-gray-900">X-marks</span>
            <span className="text-[10px] font-semibold text-white bg-gray-900 px-1.5 py-0.5 rounded-md tracking-wide">BETA</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            You signed in with {arrivedViaLabel}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            Is this your first time here?
          </h1>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            We detected other X-marks accounts may exist. Let us know how to
            set up your canvas.
          </p>

          {/* Option A — new user */}
          <form
            action={async () => {
              "use server"
              redirect("/canvas")
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left mb-3 group"
            >
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Yes, I&apos;m new here</p>
                <p className="text-xs text-gray-400 mt-0.5">Create my account with {arrivedViaLabel} and go to my canvas</p>
              </div>
            </button>
          </form>

          {/* Option B — existing user, link other platform */}
          <form
            action={async () => {
              "use server"
              // Sign in with the other platform — the jwt callback will merge
              // both providers' tokens into the existing session.
              await signIn(otherProvider, { redirectTo: "/canvas" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                {otherProvider === "twitter" ? (
                  <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#FF4500"/>
                    <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  I already have an account — sign in with {otherProviderLabel}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Links your {arrivedViaLabel} account to your existing {otherProviderLabel} account
                </p>
              </div>
            </button>
          </form>
        </div>

        {/* Escape hatch — sign out and start over */}
        <div className="text-center mt-6">
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Start over — sign out
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
