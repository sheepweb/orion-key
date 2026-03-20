import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import type { Metadata } from "next"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { getBlogArticle, getBlogArticles, getBlogTags, getTopicArticles, slugifyTag } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"

export async function generateStaticParams() {
  const articles = await getBlogArticles().catch(() => [])
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [article, config] = await Promise.all([getBlogArticle(slug), getSiteConfig().catch(() => null)])
  if (!article) return { title: "博客不存在" }

  return buildSeoMetadata({
    title: `${article.title} - 博客公告`,
    description: `${article.description} 适合用于查看站点公告、更新说明与购买建议。`,
    path: `/blog/${article.slug}`,
    keywords: article.keywords || null,
    imageUrl: article.coverImage,
    type: "article",
    siteConfig: config,
  })
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [article, allArticles, allTags, topicArticles] = await Promise.all([getBlogArticle(slug), getBlogArticles().catch(() => []), getBlogTags().catch(() => []), getTopicArticles().catch(() => [])])
  if (!article) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const tagLinks = article.tags.map((tag) => allTags.find((item) => item.slug === slugifyTag(tag))).filter(Boolean)
  const sameTagArticles = allArticles.filter((item) => item.slug !== article.slug && item.tags.some((tag) => article.tags.includes(tag))).slice(0, 3)
  const sameSectionArticles = allArticles.filter((item) => item.slug !== article.slug && item.section && item.section === article.section).slice(0, 3)
  const relatedTopics = topicArticles.filter((item) => item.tags.some((tag) => article.tags.includes(tag)) || (item.section && item.section === article.section)).slice(0, 3)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "博客公告", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${baseUrl}/blog/${article.slug}` },
    ],
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="space-y-2"><p className="text-sm text-primary">{article.section || "博客公告"}</p><h1 className="text-3xl font-bold tracking-tight text-foreground">{article.title}</h1><p className="text-base text-muted-foreground">{article.description}</p></div>
      <nav className="text-sm text-muted-foreground"><Link href="/" className="hover:text-primary">首页</Link><span className="mx-2">/</span><Link href="/blog" className="hover:text-primary">博客公告</Link><span className="mx-2">/</span><span>{article.title}</span></nav>
      {tagLinks.length > 0 ? <div className="flex flex-wrap gap-2">{tagLinks.map((tag) => <Link key={tag!.slug} href={`/blog/tag/${tag!.slug}`} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">#{tag!.name}</Link>)}</div> : null}
      <article className="prose prose-slate max-w-none rounded-2xl border border-border bg-card p-6 dark:prose-invert"><ReactMarkdown>{article.body}</ReactMarkdown></article>
      <SeoLinkSection title="同标签相关文章" items={sameTagArticles.map((item) => ({ href: `/blog/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="同栏目推荐" items={sameSectionArticles.map((item) => ({ href: `/blog/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="相关专题推荐" items={relatedTopics.map((item) => ({ href: `/topics/${item.slug}`, label: item.title, description: item.description }))} />
      <SeoLinkSection title="站内延伸入口" items={[{ href: "/topics", label: "专题内容", description: "继续查看购买指南、发货说明与售后专题" }, { href: "/help", label: "帮助中心", description: "查看 FAQ、支付说明与退款说明" }, { href: "/blog/rss.xml", label: "订阅博客 RSS", description: "通过 RSS 持续获取博客公告更新" }]} />
    </div>
  )
}

