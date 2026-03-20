import Link from "next/link"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
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

export default function FeedPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">内容订阅</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">RSS 订阅与内容聚合入口</h1>
        <p className="text-base text-muted-foreground">统一汇总站点的专题与博客 RSS 链接，方便订阅工具、搜索引擎和用户持续跟踪更新。</p>
      </div>

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
        title="继续浏览"
        items={[
          { href: "/blog", label: "博客公告", description: "查看站点公告与购买建议" },
          { href: "/topics", label: "专题内容", description: "查看购买指南、售后说明与教程专题" },
          { href: "/help", label: "帮助中心", description: "查看支付、发货、退款等常见问题" },
        ]}
      />
    </div>
  )
}

