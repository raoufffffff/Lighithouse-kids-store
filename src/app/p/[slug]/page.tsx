import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductView from '@/components/ProductView'
import { getProduct, getProducts, getRates } from '@/lib/data'

export const dynamic = 'force-static'

type Params = { params: Promise<{ slug: string }> }

const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct(decode((await params).slug))
  if (!product) return {}
  const description = (product.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 160) || undefined
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
  }
}

export default async function ProductPage({ params }: Params) {
  const slug = decode((await params).slug)
  const [product, rates] = await Promise.all([getProduct(slug), getRates()])
  if (!product) notFound()

  return <ProductView product={product} rates={rates} content={product.page_content} code={product.page_code} />
}
