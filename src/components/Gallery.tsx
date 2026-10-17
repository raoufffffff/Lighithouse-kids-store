'use client'

import { useRef } from 'react'
import type { PointerEvent } from 'react'
import Image from 'next/image'

/** Swipe gallery (CSS scroll-snap). Touch scrolls natively; with a mouse you can drag it too. */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const strip = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, x: 0, left: 0, moved: false })

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !strip.current) return
    drag.current = { active: true, x: e.clientX, left: strip.current.scrollLeft, moved: false }
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active || !strip.current) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 5 && !d.moved) {
      d.moved = true
      strip.current.style.scrollSnapType = 'none'
      // Keep receiving the drag even if the pointer leaves the strip (captured only once it IS a drag,
      // so plain clicks still reach the picture and open the zoom viewer).
      strip.current.setPointerCapture(e.pointerId)
    }
    if (d.moved) strip.current.scrollLeft = d.left - dx
  }
  const up = () => {
    const el = strip.current
    if (drag.current.active && el) {
      el.style.scrollSnapType = ''
    }
    drag.current.active = false
  }
  // A drag must not count as a click (it would open the zoom viewer).
  const swallowClick = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-brand-50 text-7xl" aria-hidden>
        🧩
      </div>
    )
  }
  return (
    <div>
      <div
        ref={strip}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={swallowClick}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0 select-none">
        {images.map((src, i) => (
          <div
            key={src}
            className={`relative aspect-square shrink-0 snap-center overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-brand-100 ${
              images.length > 1 ? 'w-[88%] sm:w-[92%]' : 'w-full'
            }`}
          >
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} - ${i + 1}`}
              fill
              draggable={false}
              priority={i === 0}
              sizes="(min-width:1024px) 560px, 90vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <p className="mt-2 text-center text-xs font-semibold text-slate-400">اسحب لمشاهدة {images.length} صور ←</p>
      )}
    </div>
  )
}
