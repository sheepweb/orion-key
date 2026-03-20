import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { HelpPageLayout } from "@/components/store/help-page-layout"
import { getHelpArticle, getHelpGroupArticles, getHelpPrevNextArticle, getRelatedHelpArticles, helpArticles } from "@/lib/help-content"
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

  const tocItems = article.sections.map((section, index) => ({
    id: `section-${index + 1}`,
    label: section.title,
  }))
  const { prev, next } = getHelpPrevNextArticle(article.slug)
  const groupItems = getHelpGroupArticles(article.slug)
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({
      href: `/help/${item.slug}`,
      label: item.title,
      description: item.description,
    }))
  const relatedItems = [
    { href: "/help", label: "返回帮助中心", description: "查看更多购买、支付、售后与使用说明" },
    ...getRelatedHelpArticles(article.slug, 3).map((item) => ({
      href: `/help/${item.slug}`,
      label: item.title,
      description: item.description,
    })),
    { href: "/topics", label: "专题内容", description: "继续浏览购买指南、发货说明与售后专题" },
    { href: "/feed", label: "内容中心", description: "返回内容索引页查看最近更新与 RSS 订阅" },
  ]

  return (
    <>
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <HelpPageLayout
        article={article}
        tocItems={tocItems}
        groupItems={groupItems}
        relatedItems={relatedItems}
        prevItem={prev ? { href: `/help/${prev.slug}`, label: prev.title, description: prev.description } : null}
        nextItem={next ? { href: `/help/${next.slug}`, label: next.title, description: next.description } : null}
      />
    </>
  )
}
