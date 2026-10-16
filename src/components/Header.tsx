import Link from 'next/link'
import type { StoreInfo } from '@/lib/types'
import Logo from './Logo'

export default function Header({ store }: { store: StoreInfo }) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2" aria-label={store.name}>
          <Logo src={store.logo_url} alt="" size={44} priority />
          <span className="text-lg font-extrabold text-ink" dir="auto">
            {store.name}
          </span>
        </Link>
        <Link
          href="/#products"
          className="rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
        >
          الألعاب
        </Link>
      </div>
    </header>
  )
}
