import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MarqueeBackground } from "@/components/landing/MarqueeBackground"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ reddit?: string; intent?: string }>
}) {
  const session = await auth()
  if (session) redirect("/canvas")

  const params = await searchParams
  const redditStatus = params.reddit // "denied" | "error" | undefined

  return (
    <main className="relative min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <MarqueeBackground />
      <div className="relative z-10 max-w-lg w-full text-center">

        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="text-2xl font-bold tracking-tight text-gray-900">X-marks</span>
          <span className="text-[10px] font-semibold text-white bg-gray-900 px-1.5 py-0.5 rounded-md tracking-wide">BETA</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
          Your saved content,<br/>finally useful.
        </h1>
        <p className="text-gray-400 text-base mb-10 leading-relaxed">
          X bookmarks and Reddit saves on an infinite canvas.<br/>
          Search, read articles, browse comments — all in one place.
        </p>

        {/* Reddit denied/error status */}
        {redditStatus === "denied" && (
          <div className="mb-5 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            Reddit access was declined — you can connect it later from the canvas.
          </div>
        )}
        {redditStatus === "error" && (
          <div className="mb-5 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            Something went wrong with Reddit. Try again or skip for now.
          </div>
        )}

        {/* Sign in with X */}
        <form
          action={async () => {
            "use server"
            await signIn("twitter", { redirectTo: "/canvas" })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-3.5 px-6 rounded-2xl hover:bg-gray-800 transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Continue with X
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Sign in with Reddit */}
        <form
          action={async () => {
            "use server"
            await signIn("reddit", { redirectTo: "/canvas" })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 px-6 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#FF4500"/>
              <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.96.68l-2.38-.5a.16.16 0 0 0-.19.12l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.52zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.19.19 0 0 1 .27-.27 3.21 3.21 0 0 0 2.58.71 3.21 3.21 0 0 0 2.58-.71.19.19 0 0 1 .27.27zm-.17-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
            </svg>
            Continue with Reddit
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400">
          Read-only access. Nothing is posted on your behalf.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            "Infinite canvas",
            "X bookmarks",
            "Reddit saves",
            "Article reader",
            "Reddit comments",
            "Thread detection",
            "Keyword search",
          ].map((f) => (
            <span key={f} className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
              {f}
            </span>
          ))}
        </div>

      </div>
    </main>
  )
}
