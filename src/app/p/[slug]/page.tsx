import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Gallery from '@/components/Gallery'
import OrderForm from '@/components/OrderForm'
import StickyOrder from '@/components/StickyOrder'
import { getProduct, getProducts, getRates } from '@/lib/data'
import { discountPercent, dzd } from '@/lib/format'
import type { Product } from '@/lib/types'

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

function Landing({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null
  return (
    <div className="space-y-0 overflow-hidden rounded-3xl bg-white ring-1 ring-brand-100">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={`${alt} - ${i + 1}`}
          width={900}
          height={1100}
          sizes="(min-width:1024px) 560px, 100vw"
          loading="lazy"
          className="block h-auto w-full"
        />
      ))}
    </div>
  )
}

function Description({ product }: { product: Product }) {
  if (!product.description?.trim()) return null
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-100 sm:p-6">
      <h2 className="text-lg font-extrabold text-ink">عن اللعبة</h2>
      <p className="mt-2 whitespace-pre-line text-base leading-8 text-slate-700" dir="auto">
        {product.description}
      </p>
    </section>
  )
}

export default async function ProductPage({ params }: Params) {
  const slug = decode((await params).slug)
  const [product, rates] = await Promise.all([getProduct(slug), getRates()])
  if (!product) notFound()

  const off = discountPercent(product.base_price, product.compare_at_price)
  const landing = <Landing images={product.landing_images} alt={product.name} />
  const above = product.landing_position === 'above'

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pb-12">
      {/*
        Phones: gallery → title & price → description/landing → order form.
        Large screens: gallery + description on the left, title + order form on the right.
        The two wrappers use `contents` on phones so their children can be ordered freely.
      */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_440px] lg:items-start lg:gap-8">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="order-1">
            <Gallery images={product.images} alt={product.name} />
          </div>
          <div className="order-3 flex flex-col gap-5">
            {above && landing}
            <Description product={product} />
            {!above && landing}
          </div>
        </div>

        <div className="contents lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-5">
          <div className="order-2">
            <h1 className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl" dir="auto">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-extrabold text-brand-600">{dzd(product.base_price)}</span>
              {off > 0 && product.compare_at_price && (
                <>
                  <span className="text-lg text-slate-400 line-through">{dzd(product.compare_at_price)}</span>
                  <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-sm font-extrabold text-white">وفّر {off}%</span>
                </>
              )}
            </div>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-brand-700">
              <li className="rounded-full bg-brand-50 px-3 py-1">🚚 توصيل لكل الولايات</li>
              <li className="rounded-full bg-brand-50 px-3 py-1">💵 الدفع عند الاستلام</li>
            </ul>
          </div>
          <div className="order-4">
            <OrderForm
              productId={product.id}
              productName={product.name}
              basePrice={product.base_price}
              variants={product.variants}
              rates={rates}
            />
          </div>
        </div>
      </div>

      <StickyOrder price={product.base_price} />
    </main>
  )
}
