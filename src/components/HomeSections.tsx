import Link from 'next/link'
import Logo from '@/components/Logo'
import ProductCard from '@/components/ProductCard'
import { resolveLink } from '@/lib/home-layout'
import type { HomeSection, LinkRef } from '@/lib/home-layout'
import type { CategoryData, ProductCardData, StoreInfo } from '@/lib/types'

const TONE = {
  brand: 'bg-brand-600 text-white',
  sun: 'bg-sun-300 text-ink',
  dark: 'bg-ink text-white',
} as const

const COLS = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' } as const

type Ctx = { products: ProductCardData[]; categories: CategoryData[] }

/** A link that may be missing (target deleted): render the children without a link then. */
function Maybe({ link, ctx, className, children, label }: { link: LinkRef | null | undefined; ctx: Ctx; className?: string; children: React.ReactNode; label?: string }) {
  const href = resolveLink(link, ctx)
  if (!href) return <div className={className}>{children}</div>
  return href.startsWith('/') ? (
    <Link href={href} className={className} aria-label={label}>{children}</Link>
  ) : (
    <a href={href} className={className} aria-label={label} rel="noopener noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>{children}</a>
  )
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  if (!title && !subtitle) return null
  return (
    <>
      {title && <h2 className="text-2xl font-extrabold text-ink sm:text-3xl" dir="auto">{title}</h2>}
      {subtitle && <p className="mt-1 text-slate-500" dir="auto">{subtitle}</p>}
    </>
  )
}

function pickProducts(s: Extract<HomeSection, { type: 'products' }>, products: ProductCardData[]): ProductCardData[] {
  let list: ProductCardData[]
  switch (s.source) {
    case 'featured':
      list = products.filter((p) => p.is_featured)
      break
    case 'category':
      list = products.filter((p) => p.category_id === s.categoryId)
      break
    case 'manual':
      list = s.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is ProductCardData => !!p)
      break
    default:
      list = products // already ordered featured-first, newest-first by the data layer
  }
  return list.slice(0, s.limit)
}

export default function HomeSections({ sections, products, categories, store }: { sections: HomeSection[]; products: ProductCardData[]; categories: CategoryData[]; store: StoreInfo }) {
  const ctx: Ctx = { products, categories }
  let firstProducts = true
  let imagesSeen = 0

  return (
    <main>
      {sections.map((s) => {
        switch (s.type) {
          case 'hero': {
            const img = s.image
            if (s.layout === 'banner' && img) {
              return (
                <section key={s.id} className="relative isolate overflow-hidden bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
                  <div className="mx-auto max-w-6xl px-4 py-16 text-center text-white sm:py-24">
                    {s.badge && <span className="inline-block rounded-full bg-sun-300 px-4 py-1 text-sm font-bold text-ink">{s.badge}</span>}
                    <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl" dir="auto">{s.headline}</h1>
                    {s.subheadline && <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg" dir="auto">{s.subheadline}</p>}
                    {s.cta && (
                      <Maybe link={s.cta.link} ctx={ctx} className="mt-6 inline-block rounded-full bg-orange-400 px-7 py-3 text-base font-extrabold text-ink shadow-lg transition hover:bg-orange-500">
                        {s.cta.label}
                      </Maybe>
                    )}
                  </div>
                </section>
              )
            }
            const center = s.layout === 'center'
            return (
              <section key={s.id} className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-[#f6f9fc]">
                <div className={`relative mx-auto max-w-6xl items-center gap-6 px-4 py-10 sm:py-14 ${center ? 'text-center' : 'grid md:grid-cols-2'}`}>
                  <div className={center ? '' : 'text-center md:text-start'}>
                    {s.badge && <span className="inline-block rounded-full bg-sun-300/40 px-4 py-1 text-sm font-bold text-brand-700">{s.badge}</span>}
                    <h1 className="mt-4 text-[1.7rem] font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl" dir="auto">{s.headline}</h1>
                    {s.subheadline && <p className={`mt-4 max-w-md text-base text-slate-600 sm:text-lg ${center ? 'mx-auto' : 'mx-auto md:mx-0'}`} dir="auto">{s.subheadline}</p>}
                    {s.cta && (
                      <Maybe link={s.cta.link} ctx={ctx} className="mt-6 inline-block rounded-full bg-orange-400 px-7 py-3 text-base font-extrabold text-ink shadow-lg shadow-orange-400/30 transition hover:bg-orange-500">
                        {s.cta.label}
                      </Maybe>
                    )}
                  </div>
                  {!center && (
                    <div className="mt-6 flex justify-center md:mt-0">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="max-h-[360px] w-auto rounded-[2rem] object-contain shadow-xl shadow-brand-500/10" />
                      ) : (
                        <div className="rounded-[2rem] bg-white p-4 shadow-xl shadow-brand-500/10 ring-1 ring-brand-100">
                          <Logo src={store.logo_url} alt={store.name} size={260} priority />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )
          }
          case 'banner': {
            const eager = imagesSeen++ === 0
            return (
              <section key={s.id} className="mx-auto mt-6 max-w-6xl px-4">
                <Maybe link={s.link} ctx={ctx} className="block overflow-hidden rounded-2xl">
                  <picture>
                    {s.mobileImage && <source media="(max-width: 639px)" srcSet={s.mobileImage} />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt={s.alt} loading={eager ? 'eager' : 'lazy'} className="block h-auto w-full" />
                  </picture>
                </Maybe>
              </section>
            )
          }
          case 'products': {
            const list = pickProducts(s, products)
            const anchor = firstProducts ? 'products' : s.id
            firstProducts = false
            return (
              <section key={s.id} id={anchor} className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12">
                <Heading title={s.title} subtitle={s.subtitle} />
                {list.length === 0 ? (
                  <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-brand-100">لا توجد منتجات هنا بعد 🧩</p>
                ) : (
                  <div className={`mt-6 grid gap-3 sm:gap-4 ${COLS[s.columns]}`}>
                    {list.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 2} />)}
                  </div>
                )}
              </section>
            )
          }
          case 'categories': {
            const cats = (s.source === 'manual'
              ? s.categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is CategoryData => !!c)
              : categories)
            if (cats.length === 0) return null
            return (
              <section key={s.id} className="mx-auto max-w-6xl px-4 pt-12">
                <Heading title={s.title} subtitle={s.subtitle} />
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {cats.map((c) => {
                    const img = c.image_url || products.find((p) => p.category_id === c.id)?.images[0] || null
                    return (
                      <Link key={c.id} href={`/c/${encodeURIComponent(c.slug)}`} className="group overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="relative aspect-[4/3] bg-brand-50">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-5xl" aria-hidden>🧩</div>
                          )}
                        </div>
                        <p className="p-3 text-center text-sm font-extrabold text-ink sm:text-base" dir="auto">{c.name}</p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          }
          case 'text':
            return (
              <section key={s.id} className={`mx-auto max-w-3xl px-4 pt-12 ${s.align === 'center' ? 'text-center' : ''}`}>
                {s.title && <h2 className="text-2xl font-extrabold text-ink sm:text-3xl" dir="auto">{s.title}</h2>}
                <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700" dir="auto">{s.body}</p>
              </section>
            )
          case 'perks':
            return (
              <section key={s.id} className="mx-auto max-w-6xl px-4">
                <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {s.items.map((p, i) => (
                    <li key={i} className="rounded-2xl border border-brand-100 bg-white p-4 text-center shadow-sm">
                      <div className="text-3xl" aria-hidden>{p.icon}</div>
                      <p className="mt-1 text-sm font-extrabold text-ink sm:text-base" dir="auto">{p.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 sm:text-sm" dir="auto">{p.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )
          case 'gallery':
            return (
              <section key={s.id} className="mx-auto max-w-6xl px-4 pt-12">
                {s.title && <h2 className="text-2xl font-extrabold text-ink sm:text-3xl" dir="auto">{s.title}</h2>}
                <div className={`mt-6 grid gap-3 ${COLS[s.columns]}`}>
                  {s.items.map((it, i) => (
                    <Maybe key={i} link={it.link} ctx={ctx} className="block overflow-hidden rounded-2xl bg-brand-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.src} alt="" loading="lazy" className="block aspect-square w-full object-cover" />
                    </Maybe>
                  ))}
                </div>
              </section>
            )
          case 'cta':
            return (
              <section key={s.id} className="mx-auto mt-12 max-w-6xl px-4">
                <div className={`rounded-3xl px-6 py-10 text-center ${TONE[s.tone]}`}>
                  <h2 className="text-2xl font-extrabold sm:text-3xl" dir="auto">{s.headline}</h2>
                  {s.text && <p className="mx-auto mt-2 max-w-xl opacity-90" dir="auto">{s.text}</p>}
                  {s.button && (
                    <Maybe link={s.button.link} ctx={ctx} className="mt-5 inline-block rounded-full bg-orange-400 px-7 py-3 font-extrabold text-ink shadow-lg transition hover:bg-orange-500">
                      {s.button.label}
                    </Maybe>
                  )}
                </div>
              </section>
            )
        }
      })}
    </main>
  )
}
