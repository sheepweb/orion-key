import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { HelpPageLayout } from "@/components/store/help-page-layout"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getHelpArticle, helpArticles } from "@/lib/help-content"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) return { title: "帮助内容不存在" }
  const config = await getSiteConfig().catch(() => null)

  return buildSeoMetadata({
    title: article.title,
    description: article.description,
    path: `/help/${article.slug}`,
    type: "article",
    siteConfig: config,
  })
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) notFound()

  const faqJsonLd = slug === "faq"
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.sections.map((section) => ({
          "@type": "Question",
          name: section.title,
          acceptedAnswer: { "@type": "Answer", text: section.paragraphs.join(" ") },
        })),
      }
    : null

  const relatedItems = [
    { href: "/", label: "返回首页", description: "继续浏览商品与分类" },
    { href: "/help", label: "返回帮助中心", description: "查看更多购买、支付、售后与使用说明" },
    ...helpArticles.filter((item) => item.slug !== article.slug).slice(0, 4).map((item) => ({
      href: `/help/${item.slug}`,
      label: item.title,
      description: item.description,
    })),
  ]

  return (
    <>
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <div className="flex flex-col gap-6">
        <HelpPageLayout article={article} />
        <SeoLinkSection title="继续浏览相关帮助内容" items={relatedItems} />
      </div>
    </>
  )
}

