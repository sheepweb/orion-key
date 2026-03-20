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
  const config = await getSiteConfig().catch(() => null)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const articleUrl = `${baseUrl}/help/${article.slug}`
  const siteName = config?.site_name || "Orion Key"

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
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "帮助中心", item: `${baseUrl}/help` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  }
  const articleJsonLd = slug === "faq"
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: article.title,
        description: article.description,
        url: articleUrl,
        mainEntityOfPage: articleUrl,
        author: { "@type": "Organization", name: siteName },
        publisher: { "@type": "Organization", name: siteName },
        articleSection: article.sections.map((section) => section.title),
      }

  const tocItems = article.sections.map((section, index) => ({
    id: `section-${index + 1}`,
    label: section.title,
  }))
  const { prev, next } = getHelpPrevNextArticle(article.slug)
  const groupItems = getHelpGroupArticles(article.slug)
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({ href: `/help/${item.slug}`, label: item.title, description: item.description }))
  const relatedItems = [
    { href: "/help", label: "返回帮助中心", description: "查看更多购买、支付、售后与使用说明" },
    ...getRelatedHelpArticles(article.slug, 3).map((item) => ({ href: `/help/${item.slug}`, label: item.title, description: item.description })),
    { href: "/topics", label: "专题内容", description: "继续浏览购买指南、发货说明与售后专题" },
    { href: "/feed", label: "内容中心", description: "返回内容索引页查看最近更新与 RSS 订阅" },
  ]
  const nextSteps = [
    next ? { href: `/help/${next.slug}`, label: `继续阅读：${next.title}`, description: next.description } : { href: "/help/faq", label: "回到常见问题 FAQ", description: "先看高频问题，快速确认是否已有现成答案" },
    { href: "/help/contact-support", label: "仍未解决？联系支持前先准备信息", description: "准备订单号、问题描述与截图，便于更快定位问题" },
    { href: "/topics", label: "查看专题内容", description: "继续阅读购买指南、发货说明与售后专题内容" },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {articleJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} /> : null}
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <HelpPageLayout
        article={article}
        tocItems={tocItems}
        groupItems={groupItems}
        relatedItems={relatedItems}
        nextSteps={nextSteps}
        prevItem={prev ? { href: `/help/${prev.slug}`, label: prev.title, description: prev.description } : null}
        nextItem={next ? { href: `/help/${next.slug}`, label: next.title, description: next.description } : null}
      />
    </>
  )
}