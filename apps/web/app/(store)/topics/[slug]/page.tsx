import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getBlogArticles, getTopicArticle, getTopicArticles, getTopicTags } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

const BEGINNER_TAGS = ["新手指南", "购买指南", "下单前检查"]

export async function generateStaticParams() {
  const articles = await getTopicArticles().catch(() => [])
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [article, config] = await Promise.all([getTopicArticle(slug), getSiteConfig().catch(() => null)])
  if (!article) return { title: "专题不存在" }

  return buildSeoMetadata({
    title: `${article.title} - 专题内容`,
    description: `${article.description} 适合用于查看购买指南、发货说明与售后建议。`,
    path: `/topics/${article.slug}`,
    keywords: article.keywords || null,
    imageUrl: article.coverImage,
    type: "article",
    siteConfig: config,
  })
}

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [article, allArticles, allTags, blogArticles] = await Promise.all([getTopicArticle(slug), getTopicArticles().catch(() => []), getTopicTags().catch(() => []), getBlogArticles().catch(() => [])])
  if (!article) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const tagLinks = article.tags.map((tag) => allTags.find((item) => item.name === tag)).filter(Boolean)
  const sameTagArticles = allArticles.filter((item) => item.slug !== article.slug && item.tags.some((tag) => article.tags.includes(tag))).slice(0, 3)
  const sameTagSlugs = new Set(sameTagArticles.map((item) => item.slug))
  const sameSectionArticles = allArticles
    .filter((item) => item.slug !== article.slug && item.section === article.section && !sameTagSlugs.has(item.slug))
    .slice(0, 3)
  const recommendedSlugs = new Set([...sameTagSlugs, ...sameSectionArticles.map((item) => item.slug)])
  const beginnerArticles = allArticles
    .filter((item) => item.slug !== article.slug && item.tags.some((tag) => BEGINNER_TAGS.includes(tag)) && !recommendedSlugs.has(item.slug))
    .slice(0, 3)
  const relatedBlogs = blogArticles.filter((item) => item.tags.some((tag) => article.tags.includes(tag)) || (item.section && item.section === article.section)).slice(0, 3)

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "专题内容", item: `${baseUrl}/topics` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${baseUrl}/topics/${article.slug}` },
    ],
  }

  const schemaJsonLd = article.schemaType === "faq" && article.faqItems.length > 0
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: article.faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }
    : article.schemaType === "howto" && article.howToSteps.length > 0
      ? { "@context": "https://schema.org", "@type": "HowTo", name: article.title, description: article.description, step: article.howToSteps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, name: `步骤 ${index + 1}`, text })) }
      : null

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {schemaJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }} /> : null}
      <div className="space-y-2"><p className="text-sm text-primary">{article.section || "专题"}</p><h1 className="text-3xl font-bold tracking-tight text-foreground">{article.title}</h1><p className="text-base text-muted-foreground">{article.description}</p></div>
      <nav className="text-sm text-muted-foreground"><Link href="/" className="hover:text-primary">首页</Link><span className="mx-2">/</span><Link href="/topics" className="hover:text-primary">专题内容</Link><span className="mx-2">/</span><span>{article.title}</span></nav>
      {tagLinks.length > 0 ? <div className="flex flex-wrap gap-2">{tagLinks.map((tag) => <Link key={tag!.slug} href={`/topics/tag/${tag!.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">#{tag!.name}</Link>)}</div> : null}
      <article className="prose prose-slate max-w-none rounded-2xl border border-border bg-card p-6 dark:prose-invert"><ReactMarkdown>{article.body}</ReactMarkdown></article>
      <SeoLinkSection title="同标签相关专题" items={sameTagArticles.map((item) => ({ href: `/topics/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="同栏目推荐" items={sameSectionArticles.map((item) => ({ href: `/topics/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="新手必读" items={beginnerArticles.map((item) => ({ href: `/topics/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="相关博客公告" items={relatedBlogs.map((item) => ({ href: `/blog/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="继续浏览相关内容" items={[{ href: "/topics", label: "返回专题列表", description: "继续浏览更多购买与售后专题" }, { href: "/blog", label: "博客公告", description: "继续查看公告、购买建议与内容更新" }, { href: "/help", label: "帮助中心", description: "查看 FAQ、支付说明与售后说明" }]} />
    </div>
  )
}

