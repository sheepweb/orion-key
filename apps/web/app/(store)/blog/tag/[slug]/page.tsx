import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getBlogArticlesByTag, getBlogTags } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateStaticParams() {
  const tags = await getBlogTags().catch(() => [])
  return tags.map((tag) => ({ slug: tag.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [tags, config] = await Promise.all([getBlogTags().catch(() => []), getSiteConfig().catch(() => null)])
  const tag = tags.find((item) => item.slug === slug)
  if (!tag) return { title: "博客标签不存在" }

  return buildSeoMetadata({
    title: `${tag.name} 博客标签聚合`,
    description: `集中查看 ${tag.name} 标签下的博客公告、购买建议与更新说明。`,
    path: `/blog/tag/${tag.slug}`,
    siteConfig: config,
  })
}

export default async function BlogTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [tags, articles] = await Promise.all([getBlogTags().catch(() => []), getBlogArticlesByTag(slug).catch(() => [])])
  const tag = tags.find((item) => item.slug === slug)
  if (!tag || articles.length === 0) notFound()

  const featuredArticles = articles.slice(0, 3)
  const relatedTags = tags
    .filter((item) => item.slug !== tag.slug)
    .slice(0, 4)
    .map((item) => ({ href: `/blog/tag/${item.slug}`, label: `#${item.name}`, description: `查看 ${item.name} 标签下的博客内容` }))
  const relatedItems = [
    { href: "/blog", label: "返回博客列表", description: "继续浏览全部博客与公告" },
    { href: "/topics", label: "专题内容", description: "继续查看购买指南、发货说明与售后专题" },
    ...relatedTags,
  ]
  const nextSteps = [
    featuredArticles[0] ? { href: `/blog/${featuredArticles[0].slug}`, label: `先看：${featuredArticles[0].title}`, description: featuredArticles[0].description } : { href: "/blog", label: "先看博客列表", description: "按博客总览继续浏览公告、更新说明与购买建议" },
    { href: "/topics", label: "再看专题内容", description: "如果你想系统阅读购买指南、发货说明与售后建议，可继续看专题页" },
    { href: "/feed", label: "最后回到内容中心", description: "按内容类型继续查看博客、专题与 RSS 入口" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-primary">博客标签</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">#{tag.name}</h1>
        <p className="text-base text-muted-foreground">当前标签下共 {tag.count} 篇内容，聚合相关公告、购买建议与更新说明。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">这个标签适合看什么</h2>
            <p className="text-sm leading-6 text-muted-foreground">适合想围绕 #{tag.name} 快速查看站点公告、更新说明与购买建议的用户优先浏览。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">你接下来可以怎么读</h2>
            <p className="text-sm leading-6 text-muted-foreground">建议先看代表性博客，再切到专题内容或内容中心，形成更完整的继续阅读路径。</p>
          </div>
        </div>
      </div>

      <SeoLinkSection title="先看什么" items={nextSteps} />
      <SeoLinkSection title="相关标签与继续浏览" items={relatedItems} />

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary">{article.section || "博客"}</p>
                <h2 className="text-lg font-semibold text-foreground">{article.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

