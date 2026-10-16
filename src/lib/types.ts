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
}

export type Variant = {
  id: string
  size: string | null
  color: string | null
  price: number | null
  stock_quantity: number
}

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
}

export type Rate = { code: number; name: string; home: number; desk: number }
