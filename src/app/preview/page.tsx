import type { Metadata } from 'next'
import PreviewClient from '@/components/PreviewClient'

export const metadata: Metadata = {
  title: 'معاينة',
  robots: { index: false, follow: false },
}

/**
 * Admin-only preview shell. It holds no data: the admin panel (its parent window) posts the draft
 * to it with postMessage, so nothing private is ever fetched or exposed by this route.
 */
export default function PreviewPage() {
  return <PreviewClient />
}
