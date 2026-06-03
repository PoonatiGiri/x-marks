import { NextRequest, NextResponse } from "next/server"
import { extract } from "@extractus/article-extractor"

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  try {
    const article = await extract(url)
    if (!article) return NextResponse.json({ error: "Could not extract article" }, { status: 422 })

    return NextResponse.json({
      title: article.title,
      content: article.content,
      description: article.description,
      author: article.author,
      published: article.published,
      source: article.source,
      url: article.url ?? url,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Extraction failed" }, { status: 500 })
  }
}
