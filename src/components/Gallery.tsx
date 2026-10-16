import Image from 'next/image'

/** Pure CSS swipe gallery (scroll-snap): zero client JavaScript. */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-brand-50 text-7xl" aria-hidden>
        🧩
      </div>
    )
  }
  return (
    <div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
