import Image from 'next/image'
import type { Section } from '@/lib/page-content'

/**
 * Renders the structured sections of a product page. Pure markup (no hooks, no client JS):
 * the FAQ uses native <details>. All text is rendered as plain text — never as HTML.
 */

const card = 'rounded-3xl bg-white p-5 ring-1 ring-brand-100 sm:p-6'
const h2 = 'text-lg font-extrabold text-ink'

function Title({ children }: { children: string }) {
  if (!children) return null
  return (
    <h2 className={`${h2} mb-3`} dir="auto">
      {children}
    </h2>
  )
}

export function SectionView({ section, productName }: { section: Section; productName: string }) {
  switch (section.type) {
    case 'hero':
      return (
        <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8">
          {section.badge && (
            <span className="mb-3 inline-block rounded-full bg-sun-300 px-3 py-1 text-xs font-extrabold text-ink" dir="auto">
              {section.badge}
            </span>
          )}
          <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl" dir="auto">
            {section.headline}
          </h2>
          {section.subheadline && (
            <p className="mt-3 text-base leading-8 text-brand-100" dir="auto">
              {section.subheadline}
            </p>
          )}
        </section>
      )

    case 'text':
      return (
        <section className={card}>
          <Title>{section.title}</Title>
          <p className="whitespace-pre-line text-base leading-8 text-slate-700" dir="auto">
            {section.body}
          </p>
        </section>
      )

    case 'benefits':
      return (
        <section className={card}>
          <Title>{section.title}</Title>
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map((it, i) => (
              <li key={i} className="rounded-2xl bg-brand-50 p-4">
                <div className="text-2xl" aria-hidden>
                  {it.icon}
                </div>
                {it.title && (
                  <h3 className="mt-1 font-extrabold text-ink" dir="auto">
                    {it.title}
                  </h3>
                )}
                {it.text && (
                  <p className="mt-1 text-sm leading-7 text-slate-600" dir="auto">
                    {it.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )

    case 'steps':
      return (
        <section className={card}>
          <Title>{section.title}</Title>
          <ol className="space-y-3">
            {section.items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  {it.title && (
                    <h3 className="font-extrabold text-ink" dir="auto">
                      {it.title}
                    </h3>
                  )}
                  {it.text && (
                    <p className="text-sm leading-7 text-slate-600" dir="auto">
                      {it.text}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )

    case 'specs':
      return (
        <section className={card}>
          <Title>{section.title}</Title>
          <dl className="divide-y divide-brand-100 overflow-hidden rounded-2xl ring-1 ring-brand-100">
            {section.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[40%_1fr] gap-3 px-4 py-3 text-sm odd:bg-brand-50/60">
                <dt className="font-bold text-ink" dir="auto">
                  {it.label}
                </dt>
                <dd className="text-slate-700" dir="auto">
                  {it.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )

    case 'faq':
      return (
        <section className={card}>
          <Title>{section.title}</Title>
          <div className="space-y-2">
            {section.items.map((it, i) => (
              <details key={i} className="group rounded-2xl bg-brand-50 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-ink [&::-webkit-details-marker]:hidden">
                  <span dir="auto">{it.q}</span>
                  <span className="text-xl text-brand-600 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-7 text-slate-700" dir="auto">
                  {it.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      )

    case 'trust':
      return (
        <ul className="flex flex-wrap gap-2">
          {section.items.map((it, i) => (
            <li
              key={i}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100"
            >
              <span aria-hidden>{it.icon}</span>
              <span dir="auto">{it.text}</span>
            </li>
          ))}
        </ul>
      )

    case 'images':
      return (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-brand-100">
          {section.images.map((src, i) => (
            <Image
              key={`${src}-${i}`}
              src={src}
              alt={`${productName} - ${i + 1}`}
              width={900}
              height={1100}
              sizes="(min-width:1024px) 560px, 100vw"
              loading="lazy"
              className="block h-auto w-full"
            />
          ))}
        </div>
      )

    case 'cta':
      return (
        <section className="rounded-3xl bg-ink p-6 text-center text-white sm:p-8">
          <h2 className="text-xl font-extrabold sm:text-2xl" dir="auto">
            {section.headline}
          </h2>
          {section.text && (
            <p className="mt-2 text-brand-100" dir="auto">
              {section.text}
            </p>
          )}
          <a
            href="#order"
            className="pulse-cta mt-5 inline-flex rounded-2xl bg-orange-400 px-8 py-3.5 text-lg font-extrabold text-ink active:scale-[0.98]"
          >
            {section.button}
          </a>
        </section>
      )
  }
}

export default function PageSections({ sections, productName }: { sections: Section[]; productName: string }) {
  return (
    <>
      {sections.map((s) => (
        <SectionView key={s.id} section={s} productName={productName} />
      ))}
    </>
  )
}
