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
