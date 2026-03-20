import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { helpArticles } from "@/lib/help-content"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)

  return buildSeoMetadata({
    title: "帮助中心",
    description: "查看支付说明、发货说明、售后退款、常见问题、订单查询与购买指南等帮助内容。",
    path: "/help",
    siteConfig: config,
  })
}

export default function HelpCenterPage() {
  const quickLinks = [
    { href: "/", label: "返回首页", description: "继续浏览分类与商品列表" },
    { href: "/help/faq", label: "常见问题 FAQ", description: "快速查看下单、支付、发货与售后的高频问题" },
    { href: "/topics", label: "购买与售后专题", description: "查看更多专题型内容页与长尾指南" },
    { href: "/blog", label: "博客公告", description: "查看公告、上新说明与购买建议" },
  ]
  const groups = [
    { title: "购买前必读", items: helpArticles.filter((article) => ["buying-guide", "account-guide", "usage-notes"].includes(article.slug)) },
    { title: "支付与发货", items: helpArticles.filter((article) => ["payment", "delivery", "order-query-guide"].includes(article.slug)) },
    { title: "售后与风控", items: helpArticles.filter((article) => ["refund", "risk-review", "contact-support"].includes(article.slug)) },
  ]
  const featuredItems = helpArticles.filter((article) => ["faq", "buying-guide", "payment", "refund"].includes(article.slug))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">帮助中心</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">购买与售后帮助</h1>
        <p className="text-base text-muted-foreground">这里整理了支付、发货、售后、FAQ、订单查询与购买指南，方便用户快速找到答案。</p>
      </div>

      <SeoLinkSection title="帮助中心快捷入口" items={quickLinks} />

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">热门问题与高频入口</h2>
          <p className="text-sm text-muted-foreground">优先查看最常访问的 FAQ、购买指南、支付说明与售后说明。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredItems.map((article) => (
            <Link key={article.slug} href={`/help/${article.slug}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">{article.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((article) => (
              <Link key={article.slug} href={`/help/${article.slug}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{article.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <SeoLinkSection title="继续探索" items={[
        { href: "/topics", label: "专题内容", description: "继续浏览购买、发货与售后专题内容" },
        { href: "/blog", label: "博客公告", description: "继续查看公告、更新说明与选购建议" },
        { href: "/help/contact-support", label: "联系我们", description: "联系客服前先准备订单号、问题描述与截图" },
        { href: "/feed", label: "内容中心", description: "返回内容索引页查看 RSS 与内容导航" },
      ]} />
    </div>
  )
}

