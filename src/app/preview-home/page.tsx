import type { Metadata } from 'next'
import PreviewHomeClient from '@/components/PreviewHomeClient'

export const metadata: Metadata = { title: 'معاينة الرئيسية', robots: { index: false, follow: false } }

/** Admin-only shell: holds no data; the admin panel posts the draft layout to it. */
export default function PreviewHomePage() {
  return <PreviewHomeClient />
}
