import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/canvas")

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Logo / wordmark */}
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

        {/* CTA */}
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

        <p className="mt-4 text-xs text-gray-400">
          Read-only access. Nothing is posted on your behalf.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
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
