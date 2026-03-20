import { getTopicArticles } from "@/lib/content-loader"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const articles = await getTopicArticles().catch(() => [])
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  const items = sortedArticles
    .map((article) => {
      const link = `${baseUrl}/topics/${article.slug}`
      const description = article.description || article.title
      const pubDate = new Date(article.publishedAt).toUTCString()

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${escapeXml(link)}</link>
          <guid>${escapeXml(link)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${escapeXml(pubDate)}</pubDate>
        </item>`
    })
    .join("")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Orion Key 专题内容</title>
    <link>${escapeXml(`${baseUrl}/topics`)}</link>
    <description>Orion Key 专题内容 RSS，聚合购买指南、发货说明、售后建议等内容。</description>
    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  })
}

