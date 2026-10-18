'use client'

import * as React from 'react'
import { Component as ReactComponent, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { discountPercent, dzd } from '@/lib/format'
import { useCheckout } from '@/lib/useCheckout'
import type { Product, Rate } from '@/lib/types'

/**
 * Runs an AI-generated landing page (compiled JS, see the admin's "AI design" page).
 * The generated component receives `{ product, checkout }`: all data and behaviour (state, delivery
 * fees, order submission, tracking) are provided here, so the generated code only draws the UI.
 * Pages are built from trusted admin input, so the code runs directly in the page.
 */

type Loaded = { Comp: React.ComponentType<Record<string, unknown>> | null; error: string }

function load(js: string): Loaded {
  try {
    const module: { exports: Record<string, unknown> } = { exports: {} }
    new Function('module', 'exports', 'React', js)(module, module.exports, React)
    const Comp = (module.exports.default ?? module.exports) as unknown
    if (typeof Comp !== 'function') return { Comp: null, error: 'الكود المُصرَّف لا يحتوي مكوّناً صالحاً' }
    return { Comp: Comp as Loaded['Comp'], error: '' }
  } catch (e) {
    return { Comp: null, error: e instanceof Error ? e.message : String(e) }
  }
}

class Boundary extends ReactComponent<
  { fallback: ReactNode; onError?: (m: string) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: Error) {
    console.error('Generated landing page failed:', err)
    this.props.onError?.(err.message)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Runner({ Comp, product, rates }: { Comp: NonNullable<Loaded['Comp']>; product: Product; rates: Rate[] }) {
  const c = useCheckout({
    productId: product.id,
    productName: product.name,
    basePrice: product.base_price,
    variants: product.variants,
    offers: product.offers,
    rates,
  })

  const checkout = {
    hasVariants: c.hasVariants,
    soldOut: c.hasVariants && !c.firstAvailable,
    colors: c.colors,
    sizes: c.sizes,
    color: c.color,
    size: c.size,
    pickColor: c.pickColor,
    pickSize: c.setSize,
    colorAvailable: c.colorAvailable,
    sizeAvailable: c.sizeAvailable,
    qty: c.qty,
    maxQty: c.maxQty,
    increase: () => c.setQty((q) => Math.min(c.maxQty, q + 1)),
    decrease: () => c.setQty((q) => Math.max(1, q - 1)),
    name: c.name,
    setName: c.setName,
    phone: c.phone,
    setPhone: c.setPhone,
    wilaya: c.wilaya,
    pickWilaya: c.pickWilaya,
    wilayas: rates,
    commune: c.commune,
    setCommune: c.setCommune,
    communes: Array.isArray(c.communes) ? c.communes : [],
    communesLoading: c.communes === 'loading',
    communesFailed: c.communes === 'error',
    address: c.address,
    setAddress: c.setAddress,
    deliveryType: c.dtype,
    setDeliveryType: c.setDtype,
    deskBlocked: c.deskBlocked,
    fee: c.fee,
    offers: c.offers,
    activeOffer: c.activeOffer,
    pickOffer: c.pickOffer,
    unitPrice: c.unitPrice,
    subtotal: c.subtotal,
    total: c.total,
    honey: c.honey,
    setHoney: c.setHoney,
    error: c.error,
    isSubmitting: c.status === 'sending',
    isSuccess: c.status === 'done',
    order: c.done,
    handleSubmit: c.submit,
    begin: c.begin,
    formatPrice: dzd,
  }

  const view = {
    id: product.id,
    name: product.name,
    price: product.base_price,
    comparePrice: product.compare_at_price,
    discountPercent: discountPercent(product.base_price, product.compare_at_price),
    description: product.description ?? '',
    images: product.images,
    landingImages: product.landing_images,
  }

  return <Comp product={view} checkout={checkout} />
}

export default function LandingRunner({
  js,
  product,
  rates,
  fallback,
  preview = false,
  onError,
}: {
  js: string
  product: Product
  rates: Rate[]
  /** Shown if the generated code cannot run, so visitors can still order. */
  fallback: ReactNode
  preview?: boolean
  onError?: (message: string) => void
}) {
  const loaded = useMemo(() => load(js), [js])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loaded.error) onError?.(loaded.error)
  }, [loaded.error, onError])

  // Generated Tailwind classes are not in the store's CSS build: generate them in the browser.
  useEffect(() => {
    if (!loaded.Comp) return
    let cancelled = false
    // Never leave the page invisible if the stylesheet generator is slow or blocked.
    const fallbackTimer = setTimeout(() => !cancelled && setReady(true), 2500)
    import('@tailwindcss/browser')
      .then(() => setTimeout(() => !cancelled && setReady(true), 60))
      .catch(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
    }
  }, [loaded.Comp])

  if (!loaded.Comp) return <>{fallback}</>

  const page = (
    <Boundary fallback={fallback} onError={onError}>
      <Runner Comp={loaded.Comp} product={product} rates={rates} />
    </Boundary>
  )

  return (
    <div style={{ opacity: ready ? 1 : 0, transition: 'opacity .2s' }}>
      {preview ? <div inert>{page}</div> : page}
    </div>
  )
}
