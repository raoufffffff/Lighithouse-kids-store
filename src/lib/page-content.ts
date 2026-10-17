/**
 * Structured product-page content.
 *
 * The page is described as DATA (never HTML): a list of typed sections that the store renders
 * with its own vetted components. Anything coming from the database or from the admin preview
 * goes through `normalizePageContent`, which drops unknown shapes, clamps lengths and rejects
 * unsafe image URLs — so a malformed or hostile payload can never break the page.
 *
 * KEEP IN SYNC with src/lib/page-content.ts in the admin repo.
 */
import { SUPABASE_URL } from './public-env'

export const ACCENTS = ['sky', 'rose', 'emerald', 'violet', 'amber'] as const
export type Accent = (typeof ACCENTS)[number]

export type Section =
  | { id: string; type: 'hero'; badge: string; headline: string; subheadline: string }
  | { id: string; type: 'text'; title: string; body: string }
  | { id: string; type: 'benefits'; title: string; items: { icon: string; title: string; text: string }[] }
  | { id: string; type: 'steps'; title: string; items: { title: string; text: string }[] }
  | { id: string; type: 'specs'; title: string; items: { label: string; value: string }[] }
  | { id: string; type: 'faq'; title: string; items: { q: string; a: string }[] }
  | { id: string; type: 'trust'; items: { icon: string; text: string }[] }
  | { id: string; type: 'images'; images: string[] }
  | { id: string; type: 'cta'; headline: string; text: string; button: string }

export type SectionType = Section['type']

export type PageContent = { v: 1; accent: Accent; sections: Section[] }

export const SECTION_TYPES: SectionType[] = [
  'hero',
  'text',
  'benefits',
  'steps',
  'specs',
  'faq',
  'trust',
  'images',
  'cta',
]

const MAX_SECTIONS = 30

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''

const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** Same-origin paths (served by the store) or this project's public storage only. */
function safeImage(v: unknown): string | null {
  const s = str(v, 700)
  if (!s) return null
  if (/^\/(?!\/)[\w\-./%]+$/.test(s) && !s.includes('..')) return s
  if (SUPABASE_URL && s.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`) && !s.includes('..')) return s
  return null
}

function safeId(v: unknown, i: number): string {
  const s = str(v, 40).replace(/[^\w-]/g, '')
  return s || `s${i}`
}

function normalizeSection(raw: unknown, i: number): Section | null {
  const r = obj(raw)
  const id = safeId(r.id, i)
  switch (r.type) {
    case 'hero': {
      const headline = str(r.headline, 120)
      if (!headline) return null
      return { id, type: 'hero', badge: str(r.badge, 40), headline, subheadline: str(r.subheadline, 300) }
    }
    case 'text': {
      const body = str(r.body, 4000)
      if (!body) return null
      return { id, type: 'text', title: str(r.title, 100), body }
    }
    case 'benefits': {
      const items = list(r.items, 12)
        .map((x) => {
          const o = obj(x)
          return { icon: str(o.icon, 8) || '✨', title: str(o.title, 80), text: str(o.text, 300) }
        })
        .filter((x) => x.title || x.text)
      return items.length ? { id, type: 'benefits', title: str(r.title, 100), items } : null
    }
    case 'steps': {
      const items = list(r.items, 12)
        .map((x) => {
          const o = obj(x)
          return { title: str(o.title, 80), text: str(o.text, 300) }
        })
        .filter((x) => x.title || x.text)
      return items.length ? { id, type: 'steps', title: str(r.title, 100), items } : null
    }
    case 'specs': {
      const items = list(r.items, 20)
        .map((x) => {
          const o = obj(x)
          return { label: str(o.label, 60), value: str(o.value, 160) }
        })
        .filter((x) => x.label && x.value)
      return items.length ? { id, type: 'specs', title: str(r.title, 100), items } : null
    }
    case 'faq': {
      const items = list(r.items, 15)
        .map((x) => {
          const o = obj(x)
          return { q: str(o.q, 160), a: str(o.a, 600) }
        })
        .filter((x) => x.q && x.a)
      return items.length ? { id, type: 'faq', title: str(r.title, 100), items } : null
    }
    case 'trust': {
      const items = list(r.items, 6)
        .map((x) => {
          const o = obj(x)
          return { icon: str(o.icon, 8) || '✅', text: str(o.text, 80) }
        })
        .filter((x) => x.text)
      return items.length ? { id, type: 'trust', items } : null
    }
    case 'images': {
      const images = list(r.images, 30)
        .map(safeImage)
        .filter((x): x is string => x !== null)
      return images.length ? { id, type: 'images', images } : null
    }
    case 'cta': {
      const headline = str(r.headline, 120)
      if (!headline) return null
      return { id, type: 'cta', headline, text: str(r.text, 240), button: str(r.button, 40) || 'اطلب الآن' }
    }
    default:
      return null
  }
}

/** Returns null when there is nothing renderable, so callers fall back to the classic layout. */
export function normalizePageContent(raw: unknown): PageContent | null {
  const r = obj(raw)
  if (r.v !== 1) return null
  const seen = new Set<string>()
  const sections: Section[] = []
  list(r.sections, MAX_SECTIONS).forEach((x, i) => {
    const s = normalizeSection(x, i)
    if (!s) return
    let id = s.id
    while (seen.has(id)) id = `${s.id}_${seen.size}`
    seen.add(id)
    sections.push({ ...s, id } as Section)
  })
  if (sections.length === 0) return null
  const accent = (ACCENTS as readonly string[]).includes(r.accent as string) ? (r.accent as Accent) : 'sky'
  return { v: 1, accent, sections }
}

/** CSS variable overrides re-theming every `brand-*` utility inside a wrapper element. */
export const ACCENT_VARS: Record<Exclude<Accent, 'sky'>, Record<string, string>> = {
  rose: {
    '--color-brand-50': '#fdf2f4',
    '--color-brand-100': '#fbe0e6',
    '--color-brand-200': '#f6c0cc',
    '--color-brand-500': '#d94a6b',
    '--color-brand-600': '#bf2f52',
    '--color-brand-700': '#9a2342',
  },
  emerald: {
    '--color-brand-50': '#effaf4',
    '--color-brand-100': '#d6f2e3',
    '--color-brand-200': '#aee3c8',
    '--color-brand-500': '#2f9e6b',
    '--color-brand-600': '#1f8556',
    '--color-brand-700': '#186843',
  },
  violet: {
    '--color-brand-50': '#f4f1fc',
    '--color-brand-100': '#e5dffa',
    '--color-brand-200': '#cbbff3',
    '--color-brand-500': '#7a5bd0',
    '--color-brand-600': '#6443b8',
    '--color-brand-700': '#4f3392',
  },
  amber: {
    '--color-brand-50': '#fff7e8',
    '--color-brand-100': '#fdebc5',
    '--color-brand-200': '#fad78f',
    '--color-brand-500': '#d98a0b',
    '--color-brand-600': '#b87108',
    '--color-brand-700': '#925a06',
  },
}
