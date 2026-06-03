import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/canvas")

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
          X-marks
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Your Twitter bookmarks on an infinite canvas.
          <br />Search, explore, rediscover.
        </p>

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

        <p className="mt-6 text-xs text-gray-400">
          We only read your bookmarks. Nothing is posted on your behalf.
        </p>
      </div>
    </main>
  )
}
