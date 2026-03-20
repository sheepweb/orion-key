import fs from "node:fs/promises"
import path from "node:path"

export type FaqItem = { question: string; answer: string }
export type MarkdownSchemaType = "faq" | "howto"

export type MarkdownContentItem = {
  slug: string
  title: string
  description: string
  keywords?: string
  section?: string
  coverImage?: string
  tags: string[]
  schemaType?: MarkdownSchemaType
  faqItems: FaqItem[]
  howToSteps: string[]
  publishedAt: string
  body: string
}

export type TopicTagItem = { name: string; slug: string; count: number }

const TOPIC_CONTENT_DIR = path.join(process.cwd(), "content", "topics")
const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog")
const SUMMARY_MAX_LENGTH = 160

export function slugifyTag(tag: string) {
  return tag.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, "")
}

function parseList(value?: string) {
  if (!value) return []
  return value.split("||").map((item) => item.trim()).filter(Boolean)
}

function parseTags(value?: string) {
  if (!value) return []
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function parseFaqItems(value?: string): FaqItem[] {
  return parseList(value)
    .map((item) => {
      const separatorIndex = item.indexOf("::")
      if (separatorIndex === -1) return null
      return { question: item.slice(0, separatorIndex).trim(), answer: item.slice(separatorIndex + 2).trim() }
    })
    .filter((item): item is FaqItem => Boolean(item?.question && item?.answer))
}

function extractSummary(body: string, maxLength = SUMMARY_MAX_LENGTH) {
  const plainText = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>*-]+\s*/gm, "")
    .replace(/[_*~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!plainText) return ""
  if (plainText.length <= maxLength) return plainText
  return `${plainText.slice(0, maxLength).trimEnd()}...`
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---\n")) return { data: {} as Record<string, string>, body: raw.trim() }
  const endIndex = raw.indexOf("\n---\n", 4)
  if (endIndex === -1) return { data: {} as Record<string, string>, body: raw.trim() }

  const frontmatter = raw.slice(4, endIndex).trim()
  const body = raw.slice(endIndex + 5).trim()
  const data: Record<string, string> = {}

  for (const line of frontmatter.split("\n")) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "")
    data[key] = value
  }

  return { data, body }
}

async function readMarkdownFile(filePath: string): Promise<MarkdownContentItem> {
  const raw = await fs.readFile(filePath, "utf8")
  const stats = await fs.stat(filePath)
  const { data, body } = parseFrontmatter(raw)
  const slug = path.basename(filePath, ".md")
  const schemaType = data.schemaType === "faq" || data.schemaType === "howto" ? data.schemaType : undefined

  return {
    slug,
    title: data.title || slug,
    description: data.description || extractSummary(body),
    keywords: data.keywords,
    section: data.section,
    coverImage: data.coverImage,
    tags: parseTags(data.tags),
    schemaType,
    faqItems: parseFaqItems(data.faq),
    howToSteps: parseList(data.steps),
    publishedAt: data.publishedAt || stats.mtime.toISOString(),
    body,
  }
}

async function readMarkdownDirectory(contentDir: string): Promise<MarkdownContentItem[]> {
  const files = await fs.readdir(contentDir)
  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".md") && !file.startsWith("."))
      .map((file) => readMarkdownFile(path.join(contentDir, file))),
  )
  return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

async function readMarkdownArticle(contentDir: string, slug: string): Promise<MarkdownContentItem | null> {
  try {
    return await readMarkdownFile(path.join(contentDir, `${slug}.md`))
  } catch {
    return null
  }
}

export async function getTopicArticles(): Promise<MarkdownContentItem[]> {
  return readMarkdownDirectory(TOPIC_CONTENT_DIR)
}

export async function getTopicArticle(slug: string): Promise<MarkdownContentItem | null> {
  return readMarkdownArticle(TOPIC_CONTENT_DIR, slug)
}

export async function getTopicTags(): Promise<TopicTagItem[]> {
  const articles = await getTopicArticles()
  const counter = new Map<string, TopicTagItem>()
  for (const article of articles) {
    for (const tag of article.tags) {
      const slug = slugifyTag(tag)
      const existing = counter.get(slug)
      counter.set(slug, { name: tag, slug, count: (existing?.count || 0) + 1 })
    }
  }
  return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"))
}

export async function getTopicArticlesByTag(tagSlug: string): Promise<MarkdownContentItem[]> {
  const articles = await getTopicArticles()
  return articles.filter((article) => article.tags.some((tag) => slugifyTag(tag) === tagSlug))
}

export async function getBlogArticles(): Promise<MarkdownContentItem[]> {
  return readMarkdownDirectory(BLOG_CONTENT_DIR)
}

export async function getBlogArticle(slug: string): Promise<MarkdownContentItem | null> {
  return readMarkdownArticle(BLOG_CONTENT_DIR, slug)
}

export async function getBlogTags(): Promise<TopicTagItem[]> {
  const articles = await getBlogArticles()
  const counter = new Map<string, TopicTagItem>()
  for (const article of articles) {
    for (const tag of article.tags) {
      const slug = slugifyTag(tag)
      const existing = counter.get(slug)
      counter.set(slug, { name: tag, slug, count: (existing?.count || 0) + 1 })
    }
  }
  return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"))
}

export async function getBlogArticlesByTag(tagSlug: string): Promise<MarkdownContentItem[]> {
  const articles = await getBlogArticles()
  return articles.filter((article) => article.tags.some((tag) => slugifyTag(tag) === tagSlug))
}

