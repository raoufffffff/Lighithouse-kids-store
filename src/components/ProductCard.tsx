import Image from 'next/image'
import Link from 'next/link'
import { discountPercent, dzd } from '@/lib/format'
import type { ProductCardData } from '@/lib/types'

export default function ProductCard({ p, priority }: { p: ProductCardData; priority?: boolean }) {
  const off = discountPercent(p.base_price, p.compare_at_price)
  return (
    <Link
      href={`/p/${encodeURIComponent(p.slug)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square bg-brand-50">
        {p.images[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            priority={priority}
            sizes="(min-width:1024px) 280px, (min-width:640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden>
            🧩
          </div>
        )}
        {off > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-extrabold text-white">
            -{off}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {p.category && <span className="text-xs font-semibold text-brand-500">{p.category}</span>}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink sm:text-base" dir="auto">
          {p.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className="text-base font-extrabold text-brand-600 sm:text-lg">{dzd(p.base_price)}</span>
          {off > 0 && p.compare_at_price && (
            <span className="text-xs text-slate-400 line-through">{dzd(p.compare_at_price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
