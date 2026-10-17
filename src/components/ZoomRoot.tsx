'use client'

import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { PhotoSlider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

/**
 * Makes every picture inside it tappable: opens a full-screen viewer with pinch / double-tap zoom,
 * drag to pan, swipe (or arrows) between pictures. It works by delegation, so it also covers the
 * pictures of AI-generated pages without the generated code having to do anything.
 * Opt out with `data-no-zoom`; limit the swipe set with `data-zoom-group`.
 */

/** next/image serves resized copies through /_next/image; zoom should show the original file. */
function original(img: HTMLImageElement): string {
  const s = img.currentSrc || img.src
  try {
    const u = new URL(s, window.location.href)
    if (u.pathname === '/_next/image') {
      const inner = u.searchParams.get('url')
      if (inner) return new URL(inner, window.location.href).href
    }
    return u.href
  } catch {
    return s
  }
}

export default function ZoomRoot({ children }: { children: ReactNode }) {
  const [view, setView] = useState<{ images: string[]; index: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const img = (e.target as HTMLElement).closest('img')
    if (!img || img.closest('[data-no-zoom], a, button, [inert]')) return
    if (img.getBoundingClientRect().width < 80) return // icons, badges…

    const group = img.closest('[data-zoom-group]') ?? e.currentTarget
    const all = Array.from(group.querySelectorAll('img')).filter(
      (i) => !i.closest('[data-no-zoom], a, button') && i.getBoundingClientRect().width >= 80,
    )
    const images: string[] = []
    let start = 0
    for (const i of all) {
      const src = original(i)
      if (images.includes(src)) {
        if (i === img) start = images.indexOf(src)
        continue
      }
      if (i === img) start = images.length
      images.push(src)
    }
    if (images.length === 0) return
    setView({ images, index: start })
    setIndex(start)
    setVisible(true)
  }

  return (
    <div data-zoom-root onClick={onClick}>
      {children}
      {view && (
        <PhotoSlider
          images={view.images.map((src, i) => ({ src, key: i }))}
          visible={visible}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setVisible(false)}
          maskOpacity={0.92}
          loop={false}
        />
      )}
    </div>
  )
}
