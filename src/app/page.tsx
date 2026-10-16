import Link from 'next/link'
import Logo from '@/components/Logo'
import ProductCard from '@/components/ProductCard'
import { getProducts, getStore } from '@/lib/data'

export const dynamic = 'force-static'

const perks = [
  { icon: '🧠', title: 'تنمّي الذكاء', text: 'ألعاب تفكير وتركيز وحلّ مشكلات' },
  { icon: '📵', title: 'بعيداً عن الشاشات', text: 'وقت لعب حقيقي يشغل الطفل ويفرحه' },
  { icon: '🚚', title: 'توصيل لـ 58 ولاية', text: 'إلى باب المنزل أو إلى المكتب' },
  { icon: '💵', title: 'الدفع عند الاستلام', text: 'تعاين طلبك ثم تدفع' },
]

export default async function Home() {
  const [store, products] = await Promise.all([getStore(), getProducts()])

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-[#f6f9fc]">
        <div aria-hidden className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-sun-300/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 sm:py-14 md:grid-cols-2">
          <div className="text-center md:text-start">
            <span className="inline-block rounded-full bg-sun-300/40 px-4 py-1 text-sm font-bold text-brand-700">
              للآباء والأمهات 💡
            </span>
            <h1 className="mt-4 text-[1.7rem] font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl" dir="auto">
              {store.tagline}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base text-slate-600 md:mx-0 sm:text-lg">
              اختر لطفلك لعبة تُحفّز تفكيره وتركيزه وخياله، وتمنحه ساعات ممتعة بعيداً عن الهاتف والتلفاز.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="#products"
                className="rounded-full bg-orange-400 px-7 py-3 text-base font-extrabold text-ink shadow-lg shadow-orange-400/30 transition hover:bg-orange-500"
              >
                تصفّح الألعاب
              </Link>
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-5 py-3 text-sm font-bold text-brand-700">
                الدفع عند الاستلام ✓
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-[2rem] bg-white p-4 shadow-xl shadow-brand-500/10 ring-1 ring-brand-100">
              <Logo src={store.logo_url} alt={store.name} size={300} priority />
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-6xl px-4">
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {perks.map((p) => (
            <li key={p.title} className="rounded-2xl border border-brand-100 bg-white p-4 text-center shadow-sm">
              <div className="text-3xl" aria-hidden>{p.icon}</div>
              <p className="mt-1 text-sm font-extrabold text-ink sm:text-base">{p.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12">
        <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">ألعابنا</h2>
        <p className="mt-1 text-slate-500">اختيارات ذكية تناسب فضول الأطفال.</p>
        {products.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-brand-100">
            منتجاتنا قادمة قريباً 🧩
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 2} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
