import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { helpArticles } from "@/lib/help-content"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)

  return buildSeoMetadata({
    title: "帮助中心问题导航",
    description: "集中查看购买前说明、支付排查、发货确认、售后退款、订单查询与常见问题等帮助内容。",
    path: "/help",
    siteConfig: config,
  })
}

export default function HelpCenterPage() {
  const quickLinks = [
    { href: "/help/buying-guide", label: "我准备下单", description: "先看购买流程、资料准备与下单前注意事项" },
    { href: "/help/payment", label: "支付遇到问题", description: "优先排查支付到账、页面未刷新与支付异常场景" },
    { href: "/help/delivery", label: "发货后还没收到", description: "查看自动发货时效、订单状态与未收到货的处理建议" },
    { href: "/help/faq", label: "先查常见问题 FAQ", description: "快速查看下单、支付、发货与售后的高频问题" },
  ]
  const scenarioLinks = [
    { href: "/help/buying-guide", label: "购买前要看什么", description: "先了解下单流程、资料准备与常见限制" },
    { href: "/help/payment", label: "支付遇到问题", description: "查看支付到账、支付异常与页面未刷新的处理建议" },
    { href: "/help/delivery", label: "发货后怎么确认", description: "了解自动发货时效、未收到货与订单状态说明" },
    { href: "/help/refund", label: "售后与退款问题", description: "查看售后边界、退款原则与联系客服前的准备事项" },
  ]
  const groups = [
    { title: "购买前必读", items: helpArticles.filter((article) => ["buying-guide", "account-guide", "usage-notes"].includes(article.slug)) },
    { title: "支付与发货", items: helpArticles.filter((article) => ["payment", "delivery", "order-query-guide"].includes(article.slug)) },
    { title: "售后与风控", items: helpArticles.filter((article) => ["refund", "risk-review", "contact-support"].includes(article.slug)) },
  ]
  const featuredItems = helpArticles.filter((article) => ["faq", "buying-guide", "payment", "refund"].includes(article.slug))
  const recommendedPath = [
    { href: "/help/buying-guide", label: "先看购买指南", description: "适合第一次下单，先了解购买流程与注意事项" },
    { href: "/help/payment", label: "再看支付说明", description: "了解支付到账、异常场景与排查方式" },
    { href: "/help/delivery", label: "然后看发货说明", description: "确认自动发货时效、订单状态与收货结果" },
    { href: "/help/contact-support", label: "最后看联系客服说明", description: "如果仍未解决，可按要求准备订单号与问题截图" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">帮助中心</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">购买与售后帮助</h1>
        <p className="text-base text-muted-foreground">这里整理了支付、发货、售后、FAQ、订单查询与购买指南，方便用户快速找到答案。</p>
      </div>

      <SeoLinkSection title="如果你现在要……" items={quickLinks} />
      <SeoLinkSection title="推荐阅读路径" items={recommendedPath} />
      <SeoLinkSection title="按问题类型进入" items={scenarioLinks} />

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

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">推荐阅读路径</h2>
          <p className="text-sm text-muted-foreground">如果你是第一次购买，可以按这个顺序依次查看，快速建立完整认知。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommendedPath.map((item, index) => (
            <Link key={item.href} href={item.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
              <div className="space-y-2">
                <p className="text-xs font-medium text-primary">步骤 {index + 1}</p>
                <h3 className="text-base font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
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

      <SeoLinkSection title="下一步去哪里" items={[
        { href: "/topics", label: "继续看专题内容", description: "适合系统浏览购买、发货与售后专题内容" },
        { href: "/blog", label: "再看博客公告", description: "适合查看公告、更新说明与选购建议" },
        { href: "/feed", label: "回到内容中心", description: "按内容类型继续查看 RSS、专题与博客入口" },
        { href: "/help/contact-support", label: "仍未解决？联系支持前先准备信息", description: "联系客服前先准备订单号、问题描述与截图" },
      ]} />
    </div>
  )
}

