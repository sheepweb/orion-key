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
    title: slug === "faq" ? "常见问题 FAQ" : `${article.title} - 帮助说明`,
    description: slug === "faq" ? "快速查看支付、发货、售后、订单查询与购买流程相关的高频问题和处理建议。" : `${article.description} 适合在购买、支付、发货或售后处理中快速定位下一步操作。`,
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
  const relatedItems = slug === "faq"
    ? [
        { href: "/help/buying-guide", label: "先看购买指南", description: "如果你还没下单，先了解购买流程、资料准备与下单前注意事项" },
        { href: "/help/payment", label: "继续看支付说明", description: "如果问题集中在支付到账、页面未刷新或支付异常，优先看这里" },
        { href: "/topics", label: "继续看专题内容", description: "系统浏览购买指南、发货说明与售后专题" },
        { href: "/feed", label: "回到内容中心", description: "按内容类型继续查看帮助、专题、博客与 RSS 入口" },
      ]
    : [
        { href: "/help", label: "返回帮助中心", description: "查看更多购买、支付、售后与使用说明" },
        ...getRelatedHelpArticles(article.slug, 3).map((item) => ({ href: `/help/${item.slug}`, label: item.title, description: item.description })),
        { href: "/topics", label: "继续看专题内容", description: "继续浏览购买指南、发货说明与售后专题" },
        { href: "/feed", label: "回到内容中心", description: "返回内容索引页查看最近更新与 RSS 订阅" },
      ]
  const nextSteps = slug === "faq"
    ? [
        { href: "/help/buying-guide", label: "路径 1：先看购买指南", description: "适合第一次下单，先了解流程、资料要求与下单前注意事项" },
        { href: "/help/delivery", label: "路径 2：再看发货说明", description: "如果问题出在收货环节，继续确认自动发货时效与订单状态" },
        { href: "/help/contact-support", label: "路径 3：仍未解决再联系支持", description: "先准备订单号、问题描述与截图，再提交问题更高效" },
      ]
    : [
        next ? { href: `/help/${next.slug}`, label: `继续阅读：${next.title}`, description: next.description } : { href: "/help/faq", label: "回到常见问题 FAQ", description: "先看高频问题，快速确认是否已有现成答案" },
        { href: "/topics", label: "下一步看专题内容", description: "继续阅读购买指南、发货说明与售后专题内容" },
        { href: "/blog", label: "最后看博客公告", description: "补充查看站点更新、上新说明与购买建议" },
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