'use client'

import { useEffect, useState } from 'react'
import ProductView from '@/components/ProductView'
import { normalizePageContent } from '@/lib/page-content'
import type { PageContent } from '@/lib/page-content'
import type { PageCode, Product, Rate, Variant } from '@/lib/types'

type PreviewData = { product: Product; rates: Rate[]; content: PageContent | null; code: PageCode | null }

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || d)
const text = (v: unknown) => (typeof v === 'string' ? v : '')
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {}

/** The parent is the signed-in admin panel; still, never trust shapes blindly. */
function coerce(msg: Record<string, unknown>): PreviewData {
  const p = rec(msg.product)
  const variants: Variant[] = (Array.isArray(p.variants) ? p.variants : []).map((x) => {
    const v = rec(x)
    return {
      id: text(v.id),
      size: text(v.size) || null,
      color: text(v.color) || null,
      price: v.price == null ? null : num(v.price),
      stock_quantity: num(v.stock_quantity),
    }
  })
  const rates: Rate[] = (Array.isArray(msg.rates) ? msg.rates : []).map((x) => {
    const r = rec(x)
    return { code: num(r.code), name: text(r.name), home: num(r.home), desk: num(r.desk) }
  })
  return {
    product: {
      id: text(p.id),
      name: text(p.name) || 'اسم المنتج',
      slug: text(p.slug),
      description: text(p.description) || null,
      base_price: num(p.base_price),
      compare_at_price: p.compare_at_price == null ? null : num(p.compare_at_price),
      images: strings(p.images),
      landing_images: strings(p.landing_images),
      landing_position: p.landing_position === 'above' ? 'above' : 'below',
      variants,
      offers: (Array.isArray(p.offers) ? p.offers : []).map((x) => {
        const o = rec(x)
        return { qty: num(o.qty), total: num(o.total), label: text(o.label) || null }
      }),
      page_content: null,
      page_code: null,
    },
    rates,
    content: normalizePageContent(msg.content),
    code: (() => {
      const c = rec(msg.content)
      return c.v === 2 && typeof c.js === 'string' && c.js.length <= 400_000 ? ({ v: 2, js: c.js } as PageCode) : null
    })(),
  }
}

export default function PreviewClient() {
  const [data, setData] = useState<PreviewData | null>(null)
  const standalone = typeof window !== 'undefined' && window.parent === window

  useEffect(() => {
    const allowed = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.replace(/\/$/, '')

    function onMessage(e: MessageEvent) {
      // Only the embedding window may drive the preview, and only from the admin origin if configured.
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
    // Ask the parent to (re)send the draft; it contains no secrets so '*' is fine.
    if (window.parent !== window) window.parent.postMessage({ type: 'lh-preview:ready' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center text-slate-500">
        {standalone ? 'هذه الصفحة تُفتح من داخل لوحة الإدارة (معاينة صفحة المنتج).' : 'جارٍ تحميل المعاينة…'}
      </main>
    )
  }

  return <ProductView
      product={data.product}
      rates={data.rates}
      content={data.content}
      code={data.code}
      preview
      onCodeError={(message) => window.parent.postMessage({ type: 'lh-preview:error', message }, '*')}
    />
}
