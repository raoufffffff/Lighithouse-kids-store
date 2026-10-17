import type { CSSProperties } from 'react'
import Image from 'next/image'
import Gallery from '@/components/Gallery'
import LandingRunner from '@/components/LandingRunner'
import OrderForm from '@/components/OrderForm'
import PageSections from '@/components/PageSections'
import StickyOrder from '@/components/StickyOrder'
import { discountPercent, dzd } from '@/lib/format'
import { ACCENT_VARS } from '@/lib/page-content'
import type { PageContent } from '@/lib/page-content'
import type { PageCode, Product, Rate } from '@/lib/types'

/**
 * The product page layout, shared by the real page (/p/[slug]) and the admin preview (/preview)
 * so the preview is guaranteed to look like what visitors get.
 *
 * `content` = structured page (see page-content.ts). When it is null the classic layout is used:
 * description + landing images, exactly as before the page builder existed.
 */

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

export default function ProductView(props: Parameters<typeof ClassicView>[0]) {
  const { code, product, rates, preview, onCodeError } = props
  if (!code) return <ClassicView {...props} />
  return (
    <LandingRunner
      js={code.js}
      product={product}
      rates={rates}
      preview={preview}
      onError={onCodeError}
      fallback={<ClassicView {...props} code={null} />}
    />
  )
}

function ClassicView({
  product,
  rates,
  content,
  code = null,
  preview = false,
  onCodeError,
}: {
  product: Product
  rates: Rate[]
  content: PageContent | null
  /** AI-designed page (compiled JS). When present and runnable it replaces the whole layout below. */
  code?: PageCode | null
  onCodeError?: (message: string) => void
  /** Admin preview: the order form is shown but cannot be used, so no test orders are created. */
  preview?: boolean
}) {
  const off = discountPercent(product.base_price, product.compare_at_price)
  const above = product.landing_position === 'above'
  const landing = <Landing images={product.landing_images} alt={product.name} />
  const theme =
    content && content.accent !== 'sky' ? (ACCENT_VARS[content.accent] as unknown as CSSProperties) : undefined

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pb-12" style={theme}>
      {/*
        Phones: gallery → title & price → description/sections → order form.
        Large screens: gallery + content on the left, title + order form on the right.
        The two wrappers use `contents` on phones so their children can be ordered freely.
      */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_440px] lg:items-start lg:gap-8">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="order-1">
            <Gallery images={product.images} alt={product.name} />
          </div>
          <div className="order-3 flex flex-col gap-5">
            {content ? (
              <PageSections sections={content.sections} productName={product.name} />
            ) : (
              <>
                {above && landing}
                <Description product={product} />
                {!above && landing}
              </>
            )}
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
            {preview ? (
              <div className="relative">
                <div inert className="pointer-events-none select-none opacity-90">
                  <OrderForm
                    productId={product.id}
                    productName={product.name}
                    basePrice={product.base_price}
                    variants={product.variants}
                    rates={rates}
                  />
                </div>
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
                  معاينة — نموذج الطلب معطّل هنا
                </p>
              </div>
            ) : (
              <OrderForm
                productId={product.id}
                productName={product.name}
                basePrice={product.base_price}
                variants={product.variants}
                rates={rates}
              />
            )}
          </div>
        </div>
      </div>

      <StickyOrder price={product.base_price} />
    </main>
  )
}
