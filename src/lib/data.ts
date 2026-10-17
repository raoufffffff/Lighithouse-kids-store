import type { Pixels, Product, ProductCardData, Rate, StoreInfo, Variant } from './types'

import { normalizePageContent } from './page-content'
import { SUPABASE_KEY, SUPABASE_URL } from './public-env'

export { SUPABASE_KEY, SUPABASE_URL }

/**
 * All reads happen at build time (and again only when /api/revalidate is called),
 * never per visitor. A failed read throws, so a broken build never ships an empty
 * store and a failed revalidation keeps serving the previous pages.
 */
async function rest<T>(path: string): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars are missing')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path.split('?')[0]}`)
  return res.json() as Promise<T>
}

const DEFAULT_STORE: StoreInfo = {
  name: 'Lighthouse Toys',
  tagline: 'ألعاب ذكية تنمي العقل وتُبعد الأطفال عن الشاشات',
  logo_url: '',
}

type SettingRow = { key: string; value: Record<string, unknown> }

async function getSettings(): Promise<SettingRow[]> {
  return rest<SettingRow[]>('lh_store_settings?select=key,value&key=in.(store,facebook_pixel,tiktok_pixel)')
}

export async function getStore(): Promise<StoreInfo> {
  const row = (await getSettings()).find((r) => r.key === 'store')
  const v = (row?.value ?? {}) as Partial<StoreInfo>
  return {
    name: v.name?.trim() || DEFAULT_STORE.name,
    tagline: v.tagline?.trim() || DEFAULT_STORE.tagline,
    logo_url: v.logo_url?.trim() || '',
  }
}

export async function getPixels(): Promise<Pixels> {
  const rows = await getSettings()
  const pick = (key: string, re: RegExp) => {
    const v = rows.find((r) => r.key === key)?.value as { pixel_id?: string; enabled?: boolean } | undefined
    const id = v?.pixel_id?.trim() ?? ''
    // Re-validate: the ID is injected into a script, so only accept the expected shape.
    return v?.enabled && re.test(id) ? id : null
  }
  return {
    facebook: pick('facebook_pixel', /^\d{10,20}$/),
    tiktok: pick('tiktok_pixel', /^[A-Za-z0-9]{10,30}$/),
  }
}

type ProductRow = {
  id: string
  name: string
  slug: string
  base_price: number | string
  compare_at_price: number | string | null
  images: string[] | null
  is_featured: boolean
  lh_categories: { name: string } | null
}

export async function getProducts(): Promise<ProductCardData[]> {
  const rows = await rest<ProductRow[]>(
    'lh_products?select=id,name,slug,base_price,compare_at_price,images,is_featured,lh_categories(name)' +
      '&is_active=eq.true&order=is_featured.desc,created_at.desc',
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    base_price: Number(r.base_price),
    compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
    images: r.images ?? [],
    is_featured: r.is_featured,
    category: r.lh_categories?.name ?? null,
  }))
}

type ProductFull = Omit<ProductRow, 'lh_categories'> & {
  description: string | null
  landing_images: string[] | null
  landing_position: string
  page_content?: unknown
  lh_product_variants: {
    id: string
    size: string | null
    color: string | null
    price: number | string | null
    stock_quantity: number
  }[]
}

export async function getProduct(slug: string): Promise<Product | null> {
  const select = (withContent: boolean) =>
    'lh_products?select=id,name,slug,description,base_price,compare_at_price,images,landing_images,landing_position,' +
    (withContent ? 'page_content,' : '') +
    'lh_product_variants(id,size,color,price,stock_quantity)' +
    `&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`

  let rows: ProductFull[]
  try {
    rows = await rest<ProductFull[]>(select(true))
  } catch {
    // Deploy-order safety: if the database does not have the page-builder column yet, keep the
    // classic layout instead of failing the whole build. A real outage fails here as well.
    rows = await rest<ProductFull[]>(select(false))
  }
  const r = rows[0]
  if (!r) return null
  const variants: Variant[] = (r.lh_product_variants ?? []).map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    price: v.price != null ? Number(v.price) : null,
    stock_quantity: v.stock_quantity,
  }))
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    base_price: Number(r.base_price),
    compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
    images: r.images ?? [],
    landing_images: r.landing_images ?? [],
    landing_position: r.landing_position === 'above' ? 'above' : 'below',
    variants,
    page_content: normalizePageContent(r.page_content),
  }
}

export async function getRates(): Promise<Rate[]> {
  const rows = await rest<
    { wilaya_code: number; wilaya_name: string; home_fee: number | string; desk_fee: number | string }[]
  >('lh_delivery_rates?select=wilaya_code,wilaya_name,home_fee,desk_fee&is_active=eq.true&order=wilaya_code')
  return rows.map((r) => ({
    code: r.wilaya_code,
    name: r.wilaya_name,
    home: Number(r.home_fee),
    desk: Number(r.desk_fee),
  }))
}
