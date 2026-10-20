import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AbRunner from '@/components/AbRunner'
import VisitTracker from '@/components/VisitTracker'
import type { RunnerVariant } from '@/components/AbRunner'
import { getAbSlugs, getAbTest, getRates, parseCode } from '@/lib/data'
import { normalizePageContent } from '@/lib/page-content'

export const dynamic = 'force-static'
// A/B test pages are for ads; keep them out of search so they don't compete with the product page.
export const metadata: Metadata = { robots: { index: false, follow: false } }

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAbSlugs()).map((slug) => ({ slug }))
}

export default async function AbPage({ params }: Params) {
  const { slug } = await params
  const [test, rates] = await Promise.all([getAbTest(slug), getRates()])
  if (!test) notFound()

  const variants: RunnerVariant[] = test.variants
    .map((v) => ({ id: v.id, code: parseCode(v.content), content: normalizePageContent(v.content) }))
    .filter((v) => v.code || v.content)
  if (variants.length === 0) notFound()

  return (
    <>
      <VisitTracker productId={test.product.id} />
      <AbRunner testId={test.id} variants={variants} product={test.product} rates={rates} />
    </>
  )
}
