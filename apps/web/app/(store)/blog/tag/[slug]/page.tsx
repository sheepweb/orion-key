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
    description: `查看 ${tag.name} 标签下的博客公告、购买建议与更新说明。`,
    path: `/blog/tag/${tag.slug}`,
    siteConfig: config,
  })
}

export default async function BlogTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [tags, articles] = await Promise.all([getBlogTags().catch(() => []), getBlogArticlesByTag(slug).catch(() => [])])
  const tag = tags.find((item) => item.slug === slug)
  if (!tag || articles.length === 0) notFound()

  const relatedItems = [
    { href: "/blog", label: "返回博客列表", description: "继续浏览全部博客与公告" },
    { href: "/topics", label: "专题内容", description: "继续查看购买指南、发货说明与售后专题" },
    ...tags
      .filter((item) => item.slug !== tag.slug)
      .slice(0, 4)
      .map((item) => ({ href: `/blog/tag/${item.slug}`, label: `#${item.name}`, description: `查看 ${item.name} 标签下的博客内容` })),
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-primary">博客标签</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">#{tag.name}</h1>
        <p className="text-base text-muted-foreground">当前标签下共 {tag.count} 篇内容，聚合相关公告、购买建议与更新说明。</p>
      </div>

      <SeoLinkSection title="继续浏览" items={relatedItems} />

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

