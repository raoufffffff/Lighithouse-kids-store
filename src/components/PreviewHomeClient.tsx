'use client'

import { useEffect, useState } from 'react'
import HomeSections from '@/components/HomeSections'
import { HeaderBar } from '@/components/SiteHeader'
import { normalizeHomeLayout, DEFAULT_HEADER } from '@/lib/home-layout'
import type { HomeLayout } from '@/lib/home-layout'
import type { CategoryData, ProductCardData, StoreInfo } from '@/lib/types'

const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const text = (v: unknown) => (typeof v === 'string' ? v.slice(0, 500) : '')
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)

type Data = { layout: HomeLayout; store: StoreInfo; products: ProductCardData[]; categories: CategoryData[] }

function coerce(msg: Record<string, unknown>): Data | null {
  const layout = normalizeHomeLayout(msg.layout)
  if (!layout) return null
  const s = rec(msg.store)
  return {
    layout,
    store: { name: text(s.name) || 'المتجر', tagline: text(s.tagline), logo_url: text(s.logo_url) },
    products: (Array.isArray(msg.products) ? msg.products : []).slice(0, 200).map((x) => {
      const p = rec(x)
      return {
        id: text(p.id), name: text(p.name), slug: text(p.slug), base_price: num(p.base_price),
        compare_at_price: p.compare_at_price == null ? null : num(p.compare_at_price),
        images: (Array.isArray(p.images) ? p.images : []).filter((i): i is string => typeof i === 'string').slice(0, 3),
        is_featured: p.is_featured === true, category: text(p.category) || null, category_id: text(p.category_id) || null,
      }
    }),
    categories: (Array.isArray(msg.categories) ? msg.categories : []).slice(0, 100).map((x) => {
      const c = rec(x)
      return { id: text(c.id), name: text(c.name), slug: text(c.slug), image_url: text(c.image_url) || null }
    }),
  }
}

export default function PreviewHomeClient() {
  const [data, setData] = useState<Data | null>(null)
  const standalone = typeof window !== 'undefined' && window.parent === window

  useEffect(() => {
    const allowed = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.replace(/\/$/, '')
    function onMessage(e: MessageEvent) {
      if (e.source !== window.parent || window.parent === window) return
      if (allowed && e.origin !== allowed) return
      const msg = rec(e.data)
      if (msg.type !== 'lh-preview:data') return
      try {
        setData(coerce(msg))
      } catch {
        /* ignore malformed frames */
      }
    }
    window.addEventListener('message', onMessage)
    if (window.parent !== window) window.parent.postMessage({ type: 'lh-preview:ready' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center text-slate-500">
        {standalone ? 'تُفتح هذه الصفحة من داخل لوحة الإدارة (معاينة الرئيسية).' : 'جارٍ تحميل المعاينة…'}
      </main>
    )
  }
  const ctx = { products: data.products, categories: data.categories }
  return (
    <div inert className="select-none">
      <HeaderBar store={data.store} config={data.layout.header ?? DEFAULT_HEADER} ctx={ctx} />
      <HomeSections sections={data.layout.sections} products={data.products} categories={data.categories} store={data.store} />
    </div>
  )
}
