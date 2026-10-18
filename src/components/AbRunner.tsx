'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductView from '@/components/ProductView'
import { AbContext, abTrack } from '@/lib/ab'
import { normalizePageContent } from '@/lib/page-content'
import type { PageContent } from '@/lib/page-content'
import type { PageCode, Product, Rate } from '@/lib/types'

export type RunnerVariant = { id: string; code: PageCode | null; content: PageContent | null }

/**
 * Every variant is baked into the static page (nothing is fetched per visitor). The browser picks one
 * at random once, remembers it so a returning visitor sees the same design, and records one view.
 */
export default function AbRunner({ testId, variants, product, rates }: {
  testId: string
  variants: RunnerVariant[]
  product: Product
  rates: Rate[]
}) {
  const [chosenId, setChosenId] = useState<string | null>(null)
  const key = `lh_ab_${testId}`

  useEffect(() => {
    let id: string | null = null
    try {
      id = localStorage.getItem(key)
    } catch {
      /* private mode */
    }
    if (!id || !variants.some((v) => v.id === id)) {
      id = variants[Math.floor(Math.random() * variants.length)].id
      try {
        localStorage.setItem(key, id)
      } catch {
        /* ignore */
      }
    }
    setChosenId(id)
    // one view per visitor session
    try {
      const seen = `lh_ab_seen_${id}`
      if (!sessionStorage.getItem(seen)) {
        sessionStorage.setItem(seen, '1')
        abTrack(id, 'view')
      }
    } catch {
      abTrack(id, 'view')
    }
  }, [key, variants])

  const chosen = useMemo(() => variants.find((v) => v.id === chosenId) ?? null, [variants, chosenId])

  if (!chosen) {
    return <main className="mx-auto max-w-md px-6 py-24 text-center text-slate-400">جارٍ التحميل…</main>
  }
  return (
    <AbContext.Provider value={{ variantId: chosen.id }}>
      <ProductView product={product} rates={rates} content={chosen.content} code={chosen.code} />
    </AbContext.Provider>
  )
}

export { normalizePageContent }
