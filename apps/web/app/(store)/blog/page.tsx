import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getBlogArticles, slugifyTag } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)
  return buildSeoMetadata({
    title: "博客公告",
    description: "汇总站点公告、购买建议、上新说明与使用技巧，形成持续更新的内容型 SEO 页面。",
    path: "/blog",
    siteConfig: config,
  })
}

export default async function BlogListPage() {
  const articles = await getBlogArticles().catch(() => [])
  const tagCounter = new Map<string, { name: string; count: number }>()
  articles.forEach((article) => {
    article.tags.forEach((tag) => {
      const key = slugifyTag(tag)
      const prev = tagCounter.get(key)
      tagCounter.set(key, { name: tag, count: (prev?.count || 0) + 1 })
    })
  })
  const popularTags = Array.from(tagCounter.entries()).map(([slug, item]) => ({ slug, ...item })).sort((a, b) => b.count - a.count).slice(0, 8)
  const latestArticle = articles[0]
  const quickLinks = [
    { href: "/", label: "返回首页", description: "继续浏览商品与分类" },
    { href: "/topics", label: "专题内容", description: "查看购买指南、售后说明等专题页" },
    { href: "/help", label: "帮助中心", description: "查看支付、发货与退款说明" },
    { href: "/blog/rss.xml", label: "订阅 RSS", description: "通过 RSS 持续获取博客公告更新" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">博客公告</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">站点博客与公告</h1>
        <p className="text-base text-muted-foreground">通过轻量 Markdown 内容系统发布公告、选购建议与更新说明，增强站点持续更新能力与长尾 SEO 覆盖。</p>
        {latestArticle ? <p className="text-sm text-muted-foreground">最近更新：<Link href={`/blog/${latestArticle.slug}`} className="text-primary hover:underline">{latestArticle.title}</Link></p> : null}
      </div>

      {popularTags.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 space-y-1">
            <h2 className="text-lg font-semibold text-foreground">热门标签</h2>
            <p className="text-sm text-muted-foreground">优先浏览公告、高频问题与购买建议相关内容入口。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link key={tag.slug} href={`/blog/tag/${tag.slug}`} className="rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                #{tag.name} · {tag.count}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <SeoLinkSection title="继续浏览" items={quickLinks} />
      <SeoLinkSection title="内容导航" items={[
        { href: "/topics", label: "专题合集", description: "查看购买指南、售后说明与内容专题" },
        { href: "/topics/tag/xin-shou-zhi-nan", label: "新手指南标签", description: "优先浏览适合首次下单用户的专题说明" },
        { href: "/help", label: "帮助中心", description: "快速查看支付、发货、退款常见问题" },
      ]} />

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <article key={article.slug} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary">{article.section || "博客"}</p>
                <h2 className="text-lg font-semibold text-foreground">
                  <Link href={`/blog/${article.slug}`} className="hover:text-primary">{article.title}</Link>
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
              </div>
              {article.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link key={tag} href={`/blog/tag/${slugifyTag(tag)}`} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-primary">
                      #{tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

