'use client'

import { useEffect, useState } from 'react'
import { dzd } from '@/lib/format'

/** Floating "order now" button (phones only). Hides itself while the order form is on screen. */
export default function StickyOrder({ price }: { price: number }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const el = document.getElementById('order')
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 transition duration-300 lg:hidden ${
        hidden ? 'pointer-events-none translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{ background: 'linear-gradient(to top, rgb(246 249 252 / 0.95) 55%, transparent)' }}
      aria-hidden={hidden}
    >
      <a
        href="#order"
        tabIndex={hidden ? -1 : 0}
        className="pulse-cta flex w-full items-center justify-between rounded-2xl bg-orange-400 px-5 py-3.5 text-lg font-extrabold text-ink active:scale-[0.98]"
      >
        <span>اطلب الآن</span>
        <span className="rounded-full bg-white/60 px-3 py-0.5 text-base">{dzd(price)}</span>
      </a>
    </div>
  )
}
