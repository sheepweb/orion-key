import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getTopicArticlesByTag, getTopicTags } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateStaticParams() {
  const tags = await getTopicTags().catch(() => [])
  return tags.map((tag) => ({ slug: tag.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [tags, config] = await Promise.all([
    getTopicTags().catch(() => []),
    getSiteConfig().catch(() => null),
  ])
  const tag = tags.find((item) => item.slug === slug)

  if (!tag) return { title: "标签不存在" }

  return buildSeoMetadata({
    title: `${tag.name} 专题标签聚合`,
    description: `集中查看 ${tag.name} 相关专题内容，快速聚合购买指南、发货说明与售后建议。`,
    path: `/topics/tag/${tag.slug}`,
    siteConfig: config,
  })
}

export default async function TopicTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [tags, articles] = await Promise.all([
    getTopicTags().catch(() => []),
    getTopicArticlesByTag(slug).catch(() => []),
  ])
  const tag = tags.find((item) => item.slug === slug)

  if (!tag || articles.length === 0) notFound()

  const featuredArticles = articles.slice(0, 3)
  const relatedTags = tags
    .filter((item) => item.slug !== tag.slug)
    .slice(0, 4)
    .map((item) => ({
      href: `/topics/tag/${item.slug}`,
      label: `#${item.name}`,
      description: `查看 ${item.name} 标签下的专题内容`,
    }))
  const relatedItems = [
    { href: "/topics", label: "返回专题列表", description: "浏览全部购买与售后专题" },
    { href: "/help", label: "帮助中心", description: "查看 FAQ、支付说明与售后说明" },
    ...relatedTags,
  ]
  const nextSteps = [
    featuredArticles[0] ? { href: `/topics/${featuredArticles[0].slug}`, label: `先看：${featuredArticles[0].title}`, description: featuredArticles[0].description } : { href: "/topics", label: "先看专题列表", description: "按专题总览继续浏览购买、发货与售后内容" },
    { href: "/help/faq", label: "再看常见问题 FAQ", description: "如果你想先确认高频问题与现成答案，优先查看 FAQ" },
    { href: "/feed", label: "最后回到内容中心", description: "按内容类型继续查看专题、博客与 RSS 入口" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-primary">专题标签</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">#{tag.name}</h1>
        <p className="text-base text-muted-foreground">
          当前标签下共 {tag.count} 篇专题，围绕 {tag.name} 聚合购买、交付与售后相关内容。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">这个标签适合先看什么</h2>
            <p className="text-sm leading-6 text-muted-foreground">适合想围绕 #{tag.name} 快速了解购买步骤、交付说明与售后边界的用户优先浏览。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">你接下来可以怎么读</h2>
            <p className="text-sm leading-6 text-muted-foreground">建议先看代表性专题，再切换到 FAQ 或内容中心，避免只停留在单一标签页。</p>
          </div>
        </div>
      </div>

      <SeoLinkSection title="先看什么" items={nextSteps} />
      <SeoLinkSection title="相关标签与继续浏览" items={relatedItems} />

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/topics/${article.slug}`}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary">{article.section || "专题"}</p>
                <h2 className="text-lg font-semibold text-foreground">{article.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
              </div>
              {article.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((item) => (
                    <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      #{item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

