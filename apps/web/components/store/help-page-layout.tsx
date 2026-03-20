import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import type { HelpArticle } from "@/lib/help-content"

type LinkItem = { href: string; label: string; description: string }
type TocItem = { id: string; label: string }

type HelpPageLayoutProps = {
  article: HelpArticle
  tocItems?: TocItem[]
  groupItems?: LinkItem[]
  relatedItems?: LinkItem[]
  nextSteps?: LinkItem[]
  prevItem?: LinkItem | null
  nextItem?: LinkItem | null
}

export function HelpPageLayout({ article, tocItems = [], groupItems = [], relatedItems = [], nextSteps = [], prevItem, nextItem }: HelpPageLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-3">
        <Link href="/help" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          返回帮助中心
        </Link>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">帮助中心</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{article.title}</h1>
          <p className="text-base text-muted-foreground">{article.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">本页适合谁看</h2>
            <p className="text-sm leading-6 text-muted-foreground">适合正在处理 {article.title}、需要快速定位支付、发货、售后或使用说明的用户阅读。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">你将获得什么</h2>
            <p className="text-sm leading-6 text-muted-foreground">本页会按步骤整理关键说明、常见异常与下一步建议，帮助你更快完成排查或继续操作。</p>
          </div>
        </div>
      </div>

      {tocItems.length > 1 ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">本页目录</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {tocItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-8">
          {article.sections.map((section, index) => (
            <section key={section.title} id={tocItems[index]?.id} className="scroll-mt-24 space-y-3 border-b border-border/50 pb-6 last:border-b-0 last:pb-0">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Section {index + 1}</p>
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {nextSteps.length > 0 ? <SeoLinkSection title="下一步去哪里" items={nextSteps} /> : null}

      {prevItem || nextItem ? (
        <div className="grid gap-4 md:grid-cols-2">
          {prevItem ? <Link href={prevItem.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"><div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">上一篇</p><h3 className="text-base font-semibold text-foreground">{prevItem.label}</h3><p className="text-sm text-muted-foreground">{prevItem.description}</p></div></Link> : <div className="hidden md:block" />}
          {nextItem ? <Link href={nextItem.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"><div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">下一篇</p><h3 className="text-base font-semibold text-foreground">{nextItem.label}</h3><p className="text-sm text-muted-foreground">{nextItem.description}</p></div></Link> : null}
        </div>
      ) : null}

      {groupItems.length > 0 ? <SeoLinkSection title="同组继续阅读" items={groupItems} /> : null}
      {relatedItems.length > 0 ? <SeoLinkSection title="相关阅读与继续探索" items={relatedItems} /> : null}
    </div>
  )
}

