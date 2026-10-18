import type { Metadata, Viewport } from 'next'
import SiteHeader from '@/components/SiteHeader'
import PixelScripts from '@/components/Pixels'
import { DEFAULT_LOGO } from '@/components/Logo'
import { getCategories, getHomeLayout, getPixels, getProducts, getStore } from '@/lib/data'
import { DEFAULT_HEADER } from '@/lib/home-layout'
import './globals.css'

export const dynamic = 'force-static'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${store.name} | ${store.tagline}`, template: `%s | ${store.name}` },
    description: store.tagline,
    icons: { icon: store.logo_url || DEFAULT_LOGO },
    openGraph: { siteName: store.name, locale: 'ar_DZ', type: 'website', images: [store.logo_url || DEFAULT_LOGO] },
  }
}

export const viewport: Viewport = {
  themeColor: '#12304f',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [store, pixels, home, products, categories] = await Promise.all([getStore(), getPixels(), getHomeLayout(), getProducts(), getCategories()])
  const ctx = {
    products: products.map((p) => ({ id: p.id, slug: p.slug })),
    categories: categories.map((c) => ({ id: c.id, slug: c.slug })),
  }
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteHeader store={store} config={home?.header ?? DEFAULT_HEADER} ctx={ctx} />
        {children}
        <footer className="mt-16 bg-ink px-4 py-8 text-center text-sm text-brand-100">
          <p className="font-bold text-white" dir="auto">
            {store.name}
          </p>
          <p className="mt-1" dir="auto">{store.tagline}</p>
          <p className="mt-3 text-xs text-brand-200/70">© {new Date().getFullYear()} {store.name}</p>
        </footer>
        <PixelScripts pixels={pixels} />
      </body>
    </html>
  )
}
