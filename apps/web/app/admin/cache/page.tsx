"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Database, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLocale } from "@/lib/context"
import { adminCacheApi } from "@/services/api"
import type { CacheModuleInfo, CacheModuleKey, CacheStatus } from "@/types"

const MODULE_LABEL_KEYS: Record<CacheModuleKey, "admin.cacheModuleSiteConfig" | "admin.cacheModuleCategory" | "admin.cacheModuleProduct"> = {
  site_config: "admin.cacheModuleSiteConfig",
  category: "admin.cacheModuleCategory",
  product: "admin.cacheModuleProduct",
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function AdminCachePage() {
  const { t } = useLocale()
  const [status, setStatus] = useState<CacheStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminCacheApi.getStatus()
      setStatus(data)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t("admin.cacheLoadFailed")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const moduleList = useMemo(() => status?.modules ?? [], [status])

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setSubmitting(true)
    try {
      await action()
      toast.success(successMessage)
      await fetchStatus()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t("common.error")))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async () => {
    if (!status) return
    const confirmText = status.enabled ? t("admin.cacheConfirmToggleOff") : t("admin.cacheConfirmToggleOn")
    if (!window.confirm(confirmText)) return
    await runAction(() => adminCacheApi.toggle(!status.enabled), t("admin.cacheToggleSuccess"))
  }

  const handleClearAll = async () => {
    if (!window.confirm(t("admin.cacheConfirmClearAll"))) return
    await runAction(() => adminCacheApi.clearAll(), t("admin.cacheClearSuccess"))
  }

  const handleClearModule = async (module: CacheModuleInfo) => {
    if (!window.confirm(`${t("admin.cacheConfirmClearModule")} ${t(MODULE_LABEL_KEYS[module.key])}`)) return
    await runAction(() => adminCacheApi.clearModule(module.key), t("admin.cacheClearSuccess"))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.cache")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.cacheDesc")}</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.cache")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.cacheDesc")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><Database className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-foreground">{t("admin.cacheStatus")}</h2>
              <p className="text-sm text-muted-foreground">{status?.enabled ? t("admin.cacheEnabled") : t("admin.cacheDisabled")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleToggle} disabled={submitting} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {t("admin.cacheToggle")}
            </button>
            <button type="button" onClick={handleClearAll} disabled={submitting} className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
              {t("admin.cacheClearAll")}
            </button>
            <button type="button" onClick={fetchStatus} disabled={submitting} className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50">
              <RefreshCw className="h-4 w-4" />
              {t("common.retry")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-foreground">{t("admin.cacheModules")}</h2>
          <p className="text-sm text-muted-foreground">{moduleList.length} / {moduleList.length} modules</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">{t("admin.cacheClearModule")}</h2>
        </div>
        <div className="divide-y divide-border">
          {moduleList.map((module) => (
            <div key={module.key} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="font-medium text-foreground">{t(MODULE_LABEL_KEYS[module.key])}</div>
                <div className="text-sm text-muted-foreground">{module.cache_names.join(" / ")}</div>
              </div>
              <button type="button" onClick={() => handleClearModule(module)} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
                {t("admin.cacheClearModule")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

