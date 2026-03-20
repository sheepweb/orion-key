import type { MetadataRoute } from "next"
import { getBlogArticles, getBlogTags, getTopicArticles, getTopicTags, slugifyTag } from "@/lib/content-loader"
import { helpArticles } from "@/lib/help-content"
import { getCategories, getProducts } from "@/services/api-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const [topicArticles, topicTags, blogArticles, blogTags] = await Promise.all([
    getTopicArticles().catch(() => []),
    getTopicTags().catch(() => []),
    getBlogArticles().catch(() => []),
    getBlogTags().catch(() => []),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/order-query`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/help`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/topics`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/feed`, changeFrequency: "weekly", priority: 0.5 },
    ...helpArticles.map((article) => ({
      url: `${baseUrl}/help/${article.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: article.slug === "faq" ? 0.7 : 0.6,
    })),
    ...topicArticles.map((article) => ({
      url: `${baseUrl}/topics/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...topicTags.map((tag) => ({
      url: `${baseUrl}/topics/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
    ...blogArticles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...blogTags.map((tag) => ({
      url: `${baseUrl}/blog/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ]

  try {
    const [productsData, categories] = await Promise.all([
      getProducts({ page: 1, page_size: 1000 }),
      getCategories().catch(() => []),
    ])

    const productRoutes: MetadataRoute.Sitemap = productsData.list.map((p) => ({
      url: `${baseUrl}/product/${p.slug || p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    const productTagRoutes: MetadataRoute.Sitemap = Array.from(new Set(productsData.list.flatMap((p) => p.tags || []))).map((tag) => ({
      url: `${baseUrl}/product-tag/${slugifyTag(tag)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }))

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug || category.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...productTagRoutes]
  } catch {
    return staticRoutes
  }
}
