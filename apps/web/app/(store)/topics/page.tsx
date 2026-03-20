import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getTopicArticles, getTopicTags } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)

  return buildSeoMetadata({
    title: "专题内容",
    description: "汇总购买指南、发货说明、售后建议等内容型 SEO 页面，承接更多长尾搜索词。",
    path: "/topics",
    siteConfig: config,
  })
}

export default async function TopicListPage() {
  const [articles, tags] = await Promise.all([
    getTopicArticles().catch(() => []),
    getTopicTags().catch(() => []),
  ])
  const quickLinks = [
    { href: "/", label: "返回首页", description: "继续浏览商品与分类" },
    { href: "/help", label: "帮助中心", description: "查看 FAQ、支付说明与售后说明" },
  ]
  const groupedSections = Array.from(new Set(articles.map((article) => article.section || "专题"))).map((section) => ({
    section,
    items: articles.filter((article) => (article.section || "专题") === section),
  }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">内容专题</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">购买与售后专题页</h1>
        <p className="text-base text-muted-foreground">通过 Markdown 内容系统输出专题型内容页，增强站内内链结构、tag 聚合能力与长尾 SEO 覆盖。</p>
      </div>

      <SeoLinkSection title="继续浏览" items={quickLinks} />

      {tags.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">热门标签</h2>
            <p className="text-sm text-muted-foreground">按主题标签快速聚合专题内容，方便用户和搜索引擎继续深入浏览。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.slug} href={`/topics/tag/${tag.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                #{tag.name} <span className="text-xs text-muted-foreground">({tag.count})</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-6">
        {groupedSections.map((group) => (
          <section key={group.section} className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">{group.section}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((article) => (
                <Link key={article.slug} href={`/topics/${article.slug}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-primary">{article.section || "专题"}</p>
                      <h3 className="text-lg font-semibold text-foreground">{article.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
                    </div>
                    {article.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">#{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

