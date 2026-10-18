'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveLink } from '@/lib/home-layout'
import type { HeaderConfig, LinkRef } from '@/lib/home-layout'
import type { CategoryData, StoreInfo } from '@/lib/types'
import Logo from './Logo'

const SIZE = { sm: 36, md: 44, lg: 60 } as const
const BAR = {
  light: 'border-b border-brand-100 bg-white/90 text-ink backdrop-blur',
  brand: 'bg-brand-600 text-white',
  dark: 'bg-ink text-white',
} as const
const ANN = { brand: 'bg-brand-600 text-white', sun: 'bg-sun-300 text-ink', dark: 'bg-ink text-white' } as const

export type HeaderCtx = { products: { id: string; slug: string }[]; categories: Pick<CategoryData, 'id' | 'slug'>[] }

function A({ link, ctx, className, children }: { link: LinkRef | null; ctx: HeaderCtx; className?: string; children: React.ReactNode }) {
  const href = resolveLink(link, ctx)
  if (!href) return null
  return href.startsWith('/') ? (
    <Link href={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className} rel="noopener noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>{children}</a>
  )
}

/** Presentational header (also rendered by the admin preview with a draft config). */
export function HeaderBar({ store, config, ctx }: { store: StoreInfo; config: HeaderConfig; ctx: HeaderCtx }) {
  const a = config.announcement
  const dark = config.style !== 'light'
  const pill = dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
  return (
    <header className="sticky top-0 z-30">
      {a.enabled && a.text && (
        <div className={`px-4 py-1.5 text-center text-xs font-bold sm:text-sm ${ANN[a.tone]}`}>
          {a.link && resolveLink(a.link, ctx) ? (
            <A link={a.link} ctx={ctx} className="underline-offset-2 hover:underline"><span dir="auto">{a.text}</span></A>
          ) : (
            <span dir="auto">{a.text}</span>
          )}
        </div>
      )}
      <div className={BAR[config.style]}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={store.name}>
            <Logo src={store.logo_url} alt="" size={SIZE[config.logoSize]} priority />
            {config.showName && <span className="max-w-[7rem] truncate text-lg font-extrabold sm:max-w-none" dir="auto">{store.name}</span>}
          </Link>
          <div className="flex min-w-0 items-center gap-1.5">
            <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto" aria-label="التنقل">
              {config.links.map((l, i) => (
                <A key={i} link={l.link} ctx={ctx} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition ${pill}`}>{l.label}</A>
              ))}
            </nav>
            {config.cta && (
              <A link={config.cta.link} ctx={ctx} className="shrink-0 whitespace-nowrap rounded-full bg-orange-400 px-4 py-1.5 text-sm font-extrabold text-ink transition hover:bg-orange-500">{config.cta.label}</A>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/** The layout's header; the preview page draws its own (draft) header instead. */
export default function SiteHeader(props: { store: StoreInfo; config: HeaderConfig; ctx: HeaderCtx }) {
  const path = usePathname()
  if (path?.startsWith('/preview-home')) return null
  return <HeaderBar {...props} />
}
