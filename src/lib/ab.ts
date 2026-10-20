'use client'

import { createContext } from 'react'
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/public-env'

/** Set by /ab/[slug] so the order form can credit an order to the variant the visitor saw. */
export const AbContext = createContext<{ variantId: string } | null>(null)

/** Fire-and-forget. Never throws and never delays the visitor. */
export function abTrack(variantId: string, kind: 'view' | 'order', orderNumber?: number) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return
    void fetch(`${SUPABASE_URL}/rest/v1/rpc/lh_ab_track`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_variant_id: variantId, p_kind: kind, p_order_number: orderNumber ?? null }),
    }).catch(() => {})
  } catch {
    /* tracking must never break the page */
  }
}

const rpc = (fn: string, body: unknown) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return
    void fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  } catch {
    /* best effort */
  }
}

/** One random id per browser, used to keep a single abandoned-cart row per visitor. */
export function cartSession(): string {
  try {
    let id = localStorage.getItem('lh_cart_sid')
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-zA-Z0-9-]/g, '')
      localStorage.setItem('lh_cart_sid', id)
    }
    return id
  } catch {
    return ''
  }
}

export const saveCart = (body: Record<string, unknown>) => rpc('lh_save_cart', body)
export const cartDone = (session: string) => session && rpc('lh_cart_done', { p_session: session })

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor/i

/** One product-page visit (server dedupes the same visitor per product for 30 minutes). Never throws. */
export function trackVisit(productId: string) {
  try {
    if (window.location.pathname.startsWith('/preview')) return
    if (navigator.webdriver || BOT.test(navigator.userAgent)) return
    const sid = cartSession()
    if (!sid || sid.length < 8) return
    rpc('lh_track_visit', { p_product: productId, p_visitor: sid })
  } catch {
    /* best effort */
  }
}
