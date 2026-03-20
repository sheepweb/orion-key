import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import type { HelpArticle } from "@/lib/help-content"

type HelpPageLayoutProps = {
  article: HelpArticle
  relatedItems?: Array<{ href: string; label: string; description: string }>
}

export function HelpPageLayout({ article, relatedItems = [] }: HelpPageLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-3">
        <Link
          href="/help"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回帮助中心
        </Link>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">帮助中心</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{article.title}</h1>
          <p className="text-base text-muted-foreground">{article.description}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {relatedItems.length > 0 ? <SeoLinkSection title="相关阅读与继续探索" items={relatedItems} /> : null}
    </div>
  )
}

