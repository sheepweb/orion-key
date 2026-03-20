"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Save, AlertTriangle, Upload, Loader2, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { adminConfigApi, adminProductApi, withMockFallback } from "@/services/api"
import { mockSiteConfigKVs } from "@/lib/mock-data"
import { useLocale } from "@/lib/context"
import type { SiteConfigKV } from "@/types"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"]
const ALLOWED_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "不支持的图片格式，仅支持 JPG/PNG/GIF/WebP/BMP/SVG"
  }
  if (file.size > 10 * 1024 * 1024) {
    return "图片大小不能超过 10MB"
  }
  return null
}

type TabKey = "basic" | "seo" | "announcement" | "points" | "contact" | "maintenance"

export default function AdminSiteConfigPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<TabKey>("basic")
  const [configMap, setConfigMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [popupUploading, setPopupUploading] = useState(false)
  const popupTextareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const data = await withMockFallback(
        () => adminConfigApi.get(),
        () => [...mockSiteConfigKVs]
      )
      const map: Record<string, string> = {}
      data.forEach((kv: SiteConfigKV) => { map[kv.config_key] = kv.config_value })
      setConfigMap(map)
    } catch {
      const map: Record<string, string> = {}
      mockSiteConfigKVs.forEach((kv) => { map[kv.config_key] = kv.config_value })
      setConfigMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const getValue = (key: string) => configMap[key] ?? ""
  const setValue = (key: string, value: string) => {
    setConfigMap(prev => ({ ...prev, [key]: value }))
  }
  const getBool = (key: string) => configMap[key] === "true"
  const toggleBool = (key: string) => {
    setConfigMap(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const configs = Object.entries(configMap).map(([config_key, config_value]) => ({
        config_key,
        config_value,
      }))
      await withMockFallback(
        () => adminConfigApi.update({ configs }),
        () => null
      )
      toast.success("保存成功")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleMaintenance = async () => {
    const newEnabled = !getBool("maintenance_enabled")
    try {
      await withMockFallback(
        () => adminConfigApi.toggleMaintenance(newEnabled),
        () => null
      )
      setValue("maintenance_enabled", String(newEnabled))
      toast.success(newEnabled ? "已开启维护模式" : "已关闭维护模式")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.siteConfig")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.siteConfigDesc")}</p>
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.siteConfig")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.siteConfigDesc")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {([
          { key: "basic" as const, label: t("admin.basicInfo") },
          { key: "seo" as const, label: "SEO 设置" },
          { key: "announcement" as const, label: t("admin.announcementTab") },
          { key: "points" as const, label: t("admin.pointsSettings") },
          { key: "contact" as const, label: t("admin.contactTab") },
          { key: "maintenance" as const, label: t("admin.maintenanceTab") },
        ]).map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            className={cn(
              "whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === tabItem.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab(tabItem.key)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Basic Info */}
      {tab === "basic" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.siteName")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("site_name")}
                onChange={(e) => setValue("site_name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.siteSlogan")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("site_slogan")}
                onChange={(e) => setValue("site_slogan", e.target.value)}
                placeholder="Unlock Your AI Potential"
              />
              <p className="text-xs text-muted-foreground">{t("admin.siteSloganHint")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.siteDesc")}</label>
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("site_description")}
                onChange={(e) => setValue("site_description", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("admin.siteDescHint")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.logoUrl")}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://..."
                  value={getValue("logo_url")}
                  onChange={(e) => setValue("logo_url", e.target.value)}
                />
                <label className={cn("flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent transition-colors", logoUploading && "pointer-events-none opacity-50")}>
                  {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  上传
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const err = validateImageFile(file)
                      if (err) { toast.error(err); e.target.value = ""; return }
                      setLogoUploading(true)
                      try {
                        const result = await adminProductApi.uploadImage(file)
                        setValue("logo_url", result.url)
                        toast.success("上传成功")
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "上传失败")
                      } finally {
                        setLogoUploading(false)
                        e.target.value = ""
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">建议使用正方形 Logo 图片，支持 JPG/PNG/GIF/WebP/SVG</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.footerText")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("footer_text")}
                onChange={(e) => setValue("footer_text", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.githubUrl")}</label>
              <input
                type="url"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://github.com/..."
                value={getValue("github_url")}
                onChange={(e) => setValue("github_url", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("admin.githubUrlHint")}</p>
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>

      {/* SEO */}
      {tab === "seo" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex max-w-2xl flex-col gap-5">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              这些字段将作为全站默认 SEO 来源，页面未单独设置时会自动回退到这里。
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">默认 SEO 标题</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("seo_default_title")}
                onChange={(e) => setValue("seo_default_title", e.target.value)}
                placeholder="Orion Key - 数字商品自动发货平台"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">默认 SEO 描述</label>
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("seo_default_description")}
                onChange={(e) => setValue("seo_default_description", e.target.value)}
                placeholder="用于首页、帮助页、分类页等未单独配置时的默认描述"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">默认 SEO 关键词</label>
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("seo_default_keywords")}
                onChange={(e) => setValue("seo_default_keywords", e.target.value)}
                placeholder="例如：数字商品,自动发货,ChatGPT账号,Claude账号"
              />
              <p className="text-xs text-muted-foreground">建议使用逗号分隔，作为页面未单独填写 keywords 时的默认回退值。</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">OG 标题</label>
                <input
                  type="text"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={getValue("seo_og_title")}
                  onChange={(e) => setValue("seo_og_title", e.target.value)}
                  placeholder="分享卡片默认标题"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Title 模板</label>
                <input
                  type="text"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={getValue("seo_title_template")}
                  onChange={(e) => setValue("seo_title_template", e.target.value)}
                  placeholder="%s | Orion Key"
                />
                <p className="text-xs text-muted-foreground">使用 %s 作为页面标题占位符，例如：%s | Orion Key</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">OG 描述</label>
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("seo_og_description")}
                onChange={(e) => setValue("seo_og_description", e.target.value)}
                placeholder="分享卡片默认描述"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">OG 图片 URL</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("seo_og_image")}
                onChange={(e) => setValue("seo_og_image", e.target.value)}
                placeholder="https://.../og-image.png"
              />
              <p className="text-xs text-muted-foreground">建议使用 1200 x 630 图片，页面未提供封面时会回退使用此图。</p>
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Announcement */}
      {tab === "announcement" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 max-w-xl">
            {/* ① 顶栏滚动公告开关 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("admin.enableAnnouncement")}</label>
              <button
                type="button"
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  getBool("announcement_enabled") ? "bg-primary" : "bg-muted"
                )}
                onClick={() => toggleBool("announcement_enabled")}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  getBool("announcement_enabled") && "translate-x-5"
                )} />
              </button>
            </div>
            {/* ② 顶栏滚动公告内容 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.scrollAnnouncement")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("announcement")}
                onChange={(e) => setValue("announcement", e.target.value)}
              />
            </div>
            {/* ③ 弹窗公告开关 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("admin.enablePopup")}</label>
              <button
                type="button"
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  getBool("popup_enabled") ? "bg-primary" : "bg-muted"
                )}
                onClick={() => toggleBool("popup_enabled")}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  getBool("popup_enabled") && "translate-x-5"
                )} />
              </button>
            </div>
            {/* ④ 弹窗公告内容（Markdown 编辑器 + 图片上传） */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t("admin.popupContent")}</label>
                <label className={cn("flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", popupUploading && "pointer-events-none opacity-50")}>
                  {popupUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  插入图片
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const err = validateImageFile(file)
                      if (err) { toast.error(err); e.target.value = ""; return }
                      setPopupUploading(true)
                      try {
                        const result = await adminProductApi.uploadImage(file)
                        const textarea = popupTextareaRef.current
                        const mdImage = `![${file.name}](${result.url})`
                        if (textarea) {
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const text = getValue("popup_content")
                          const before = text.substring(0, start)
                          const after = text.substring(end)
                          const newText = before + (before.length > 0 && !before.endsWith("\n") ? "\n" : "") + mdImage + "\n" + after
                          setValue("popup_content", newText)
                          requestAnimationFrame(() => {
                            const newPos = before.length + (before.length > 0 && !before.endsWith("\n") ? 1 : 0) + mdImage.length + 1
                            textarea.selectionStart = textarea.selectionEnd = newPos
                            textarea.focus()
                          })
                        } else {
                          const cur = getValue("popup_content")
                          setValue("popup_content", cur + (cur ? "\n" : "") + mdImage + "\n")
                        }
                        toast.success("图片已插入")
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "上传失败")
                      } finally {
                        setPopupUploading(false)
                        e.target.value = ""
                      }
                    }}
                  />
                </label>
              </div>
              <textarea
                ref={popupTextareaRef}
                className="min-h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={"支持 Markdown 格式编辑\n# 标题  ## 二级标题  ### 三级标题\n**粗体**  *斜体*  空一行为段落换行\n![图片描述](图片URL) — 可点击上方「插入图片」自动生成"}
                value={getValue("popup_content")}
                onChange={(e) => setValue("popup_content", e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Points Setting */}
      {tab === "points" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 max-w-xl">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("admin.enablePointsSystem")}</label>
              <button
                type="button"
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  getBool("points_enabled") ? "bg-primary" : "bg-muted"
                )}
                onClick={() => toggleBool("points_enabled")}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  getBool("points_enabled") && "translate-x-5"
                )} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.pointsRate")}</label>
              <input
                type="number"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("points_rate")}
                onChange={(e) => setValue("points_rate", e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Contact */}
      {tab === "contact" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.contactEmail")}</label>
              <input
                type="email"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("contact_email")}
                onChange={(e) => setValue("contact_email", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.contactTelegram")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("contact_telegram")}
                onChange={(e) => setValue("contact_telegram", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.contactTelegramGroup")}</label>
              <input
                type="text"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://t.me/..."
                value={getValue("contact_telegram_group")}
                onChange={(e) => setValue("contact_telegram_group", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("admin.contactTelegramGroupHint")}</p>
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Maintenance */}
      {tab === "maintenance" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 max-w-xl">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("admin.maintenanceWarning")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("admin.maintenanceWarningDesc")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">{t("admin.maintenanceLabel")}</label>
                <p className="text-xs text-muted-foreground">{t("admin.maintenanceLabelDesc")}</p>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  getBool("maintenance_enabled") ? "bg-red-500" : "bg-muted"
                )}
                onClick={handleToggleMaintenance}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  getBool("maintenance_enabled") && "translate-x-5"
                )} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t("admin.maintenanceMessage")}</label>
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={getValue("maintenance_message")}
                onChange={(e) => setValue("maintenance_message", e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? t("admin.saving") : t("admin.saveSettings")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
