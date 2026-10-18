import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/data'

export const dynamic = 'force-static'

type Params = { params: Promise<{ slug: string }> }

const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = decode((await params).slug)
  const cat = (await getCategories()).find((c) => c.slug === slug)
  return cat ? { title: cat.name } : {}
}

export default async function CategoryPage({ params }: Params) {
  const slug = decode((await params).slug)
  const [categories, products] = await Promise.all([getCategories(), getProducts()])
  const cat = categories.find((c) => c.slug === slug)
  if (!cat) notFound()
  const list = products.filter((p) => p.category_id === cat.id)
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl" dir="auto">{cat.name}</h1>
      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-brand-100">لا توجد منتجات في هذه الفئة بعد 🧩</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {list.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 2} />)}
        </div>
      )}
    </main>
  )
}
