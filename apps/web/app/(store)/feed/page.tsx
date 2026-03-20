import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getBlogArticles, getTopicArticles } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)
  return buildSeoMetadata({
    title: "内容订阅",
    description: "集中查看专题 RSS、博客 RSS 与内容入口，方便持续追踪站点更新。",
    path: "/feed",
    siteConfig: config,
  })
}

export default async function FeedPage() {
  const [topics, blogs] = await Promise.all([
    getTopicArticles().catch(() => []),
    getBlogArticles().catch(() => []),
  ])
  const latestUpdates = [...topics.map((item) => ({ ...item, href: `/topics/${item.slug}`, type: "专题" })), ...blogs.map((item) => ({ ...item, href: `/blog/${item.slug}`, type: "博客" }))]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 6)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">内容中心</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">内容索引与 RSS 订阅入口</h1>
        <p className="text-base text-muted-foreground">统一汇总站点的帮助、专题、博客与订阅入口，方便用户和搜索引擎继续发现购买指南、FAQ 与更新内容。</p>
      </div>

      <SeoLinkSection
        title="新手入门"
        items={[
          { href: "/help/buying-guide", label: "新手购买指南", description: "首次下单前先了解选品、支付与收货流程" },
          { href: "/help/faq", label: "常见问题 FAQ", description: "快速查看支付、发货、售后等高频问题" },
          { href: "/topics", label: "购买与售后专题", description: "继续浏览购买建议、发货说明与售后专题" },
        ]}
      />

      <SeoLinkSection
        title="高频入口"
        items={[
          { href: "/help/payment", label: "支付说明", description: "查看支付到账时机与常见支付异常处理" },
          { href: "/help/delivery", label: "发货说明", description: "了解自动发货、时效与未收到货的处理建议" },
          { href: "/help/refund", label: "售后与退款", description: "查看售后边界、退款原则与提交建议" },
          { href: "/help/order-query-guide", label: "订单查询说明", description: "了解订单查询入口、状态说明与异常处理" },
        ]}
      />

      {latestUpdates.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">最近更新</h2>
            <p className="text-sm text-muted-foreground">自动汇总 blog 与 topics 的最新内容，方便快速追踪站点更新。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestUpdates.map((item) => (
              <Link key={`${item.type}-${item.slug}`} href={item.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary">{item.type}</p>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">专题 RSS</h2>
            <p className="text-sm text-muted-foreground">订阅购买指南、发货说明、售后建议等内容更新。</p>
            <Link href="/topics/rss.xml" className="text-sm text-primary hover:underline">/topics/rss.xml</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">博客 RSS</h2>
            <p className="text-sm text-muted-foreground">订阅公告、上新说明、购买建议与内容更新。</p>
            <Link href="/blog/rss.xml" className="text-sm text-primary hover:underline">/blog/rss.xml</Link>
          </div>
        </div>
      </div>

      <SeoLinkSection
        title="内容导航"
        items={[
          { href: "/blog", label: "博客公告", description: "查看站点公告、购买建议与更新说明" },
          { href: "/topics", label: "专题内容", description: "查看购买指南、售后说明与教程专题" },
          { href: "/help", label: "帮助中心", description: "查看支付、发货、退款等常见问题" },
          { href: "/feed", label: "RSS 与内容订阅", description: "集中查看 RSS 订阅入口和内容索引页" },
        ]}
      />
    </div>
  )
}

