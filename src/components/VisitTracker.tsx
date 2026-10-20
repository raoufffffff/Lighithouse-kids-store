'use client'

import { useEffect } from 'react'
import { trackVisit } from '@/lib/ab'

/** Renders nothing; records one visit to the product page once it is shown in the browser. */
export default function VisitTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackVisit(productId)
  }, [productId])
  return null
}
