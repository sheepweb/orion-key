import Link from "next/link"

type SeoLinkItem = {
  href: string
  label: string
  description?: string
}

export function SeoLinkSection({
  title,
  items,
}: {
  title: string
  items: SeoLinkItem[]
}) {
  if (!items.length) return null

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-xl border border-border/70 bg-background px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                {item.description ? (
                  <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

