import type { PageContent } from './page-content'

/** AI-designed page: TSX compiled to plain JS by the admin (see LandingRunner). */
export type PageCode = { v: 2; js: string }

export type StoreInfo = { name: string; tagline: string; logo_url: string }

export type Pixels = { facebook: string | null; tiktok: string | null }

export type ProductCardData = {
  id: string
  name: string
  slug: string
  base_price: number
  compare_at_price: number | null
  images: string[]
  is_featured: boolean
  category: string | null
  category_id: string | null
}

export type CategoryData = { id: string; name: string; slug: string; image_url: string | null }

export type Variant = {
  id: string
  size: string | null
  color: string | null
  price: number | null
  stock_quantity: number
}

export type Offer = { qty: number; total: number; label: string | null }

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  compare_at_price: number | null
  images: string[]
  landing_images: string[]
  landing_position: 'above' | 'below'
  variants: Variant[]
  /** Quantity offers ("buy 2 for X"). Priced again on the server. */
  offers: Offer[]
  /** Published structured page (page builder). null = use the classic layout. */
  page_content: PageContent | null
  /** Published AI-designed page. Takes priority over page_content. */
  page_code: PageCode | null
}

export type Rate = { code: number; name: string; home: number; desk: number }
