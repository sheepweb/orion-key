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
    { href: "/help/contact-support", label: "联系我们", description: "查看支持方式与联系客服前的准备信息" },
    { href: "/topics", label: "购买与售后专题", description: "查看更多专题型内容页与长尾指南" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">帮助中心</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">购买与售后帮助</h1>
        <p className="text-base text-muted-foreground">这里整理了支付、发货、售后、FAQ、订单查询与购买指南，方便用户快速找到答案。</p>
      </div>

      <SeoLinkSection title="帮助中心快捷入口" items={quickLinks} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {helpArticles.map((article) => (
          <Link key={article.slug} href={`/help/${article.slug}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">{article.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{article.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

